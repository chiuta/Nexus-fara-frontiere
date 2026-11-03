// Nexus — contractul cu API-ul Anthropic: antetul anthropic-version = 2026-10-21 și niciun parametru de eșantionare (temperature/top_p/top_k),
// eliminați de 2026-10-21 (cererile care îi trimit primesc 400). Cererile sunt interceptate; fără rețea reală.
// Rulare: node tests/anthropic-api.test.mjs
import {createRequire} from 'module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require = createRequire(process.env.PW_ROOT || '/opt/node-tools/package.json');
const {chromium} = require('playwright');
const URL_APP = 'file://' + path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
let pass = 0, fail = 0;
const ok = (c, n, i) => { if (c) { pass++; console.log('  ok   ' + n); } else { fail++; console.log('  FAIL ' + n + (i === undefined ? '' : ' ' + JSON.stringify(i).slice(0, 400))); } };
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
const ctx = await browser.newContext();
const seen = [], ext = [];
await ctx.route(/^https?:/, async (r) => {
  const rq = r.request(), u = rq.url();
  if (u.startsWith('https://api.anthropic.com/v1/messages')) {
    seen.push({url: u, h: rq.headers(), body: JSON.parse(rq.postData() || '{}')});
    return r.fulfill({status: 200, contentType: 'text/event-stream', body: 'data: ' + JSON.stringify({type: 'content_block_delta', delta: {type: 'text_delta', text: 'ok'}}) + '\n\n'});
  }
  if (u.startsWith('https://api.anthropic.com/v1/models')) {
    seen.push({url: u, h: rq.headers()});
    return r.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({data: [{id: 'claude-sonnet-5-5'}]})});
  }
  ext.push(u); r.abort();
});
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await ctx.addInitScript(() => { try { localStorage.setItem('nexus:settings', JSON.stringify({providers: {anthropic: {apiKey: 'sk-ant-test', defaultModel: 'claude-sonnet-5-5'}}})); } catch { /* fără localStorage */ } });
await page.goto(URL_APP);
await page.waitForSelector('#btn-new-conv');
await page.evaluate(() => document.querySelector('#btn-new-conv').click());
await page.selectOption('#provider-select', 'anthropic');
await page.fill('#input-text', 'salut');
await page.evaluate(() => document.querySelector('#btn-send').click());
await page.waitForFunction(() => /\bok\b/.test(document.body.innerText) && !document.querySelector('#btn-send').disabled, null, {timeout: 15000});
ok(true, 'răspunsul SSE apare în conversație');
const m = seen.find((x) => x.url.includes('/v1/messages'));
ok(m && m.h['anthropic-version'] === '2026-10-21', 'POST /v1/messages trimite anthropic-version: 2026-10-21', m && m.h['anthropic-version']);
ok(m && !('temperature' in m.body) && !('top_p' in m.body) && !('top_k' in m.body), 'corpul nu conține temperature/top_p/top_k', m && Object.keys(m.body));
ok(m && m.body.stream === true && m.body.model === 'claude-sonnet-5-5', 'restul corpului neschimbat', m && m.body);
ok(m && m.h['anthropic-dangerous-direct-browser-access'] === 'true' && m.h['x-api-key'] === 'sk-ant-test', 'antetele de acces din browser rămân');
await page.evaluate(() => document.querySelector('#btn-settings').click());
await page.waitForSelector('[data-fetch-models="anthropic"]');
await page.evaluate(() => document.querySelector('[data-fetch-models="anthropic"]').click());
for (let i = 0; i < 40 && !seen.find((x) => x.url.includes('/v1/models')); i++) await page.evaluate(() => new Promise((r) => setTimeout(r, 100)));
const mo = seen.find((x) => x.url.includes('/v1/models'));
ok(mo && mo.h['anthropic-version'] === '2026-10-21', 'GET /v1/models trimite anthropic-version: 2026-10-21', mo && mo.h['anthropic-version']);
ok(!(await page.evaluate(() => document.documentElement.innerHTML)).includes('2023-06-01'), 'nicio urmă de 2023-06-01 în pagină');
ok(!errs.length && !ext.length, '0 erori, 0 cereri externe în afara api.anthropic.com', [errs, ext]);
await browser.close();
console.log(`\n${pass} ok, ${fail} eșuate`);
process.exit(fail ? 1 : 0);
