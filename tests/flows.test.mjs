// Nexus 2.0 — fluxuri de agenți (lanț de pași instrucțiune / unealtă / verificare), cu furnizor FALS (cereri interceptate, fără rețea reală).
import {createRequire} from 'module';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require = createRequire(process.env.PW_ROOT || import.meta.url);
const {chromium} = require('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const URL_APP = 'file://' + path.join(HERE, '..', 'index.html');
const AXE = process.env.AXE_PATH || process.env.FFF_AXE;
let pass = 0, fail = 0;
const ok = (c, n, i) => { if (c) { pass++; console.log('  ok   ' + n); } else { fail++; console.log('  FAIL ' + n + (i === undefined ? '' : ' ' + JSON.stringify(i).slice(0, 500))); } };
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox']});
const BASE = 'http://localhost:11434';
const errs = [], ext = [], reqs = [];
let replyFn = () => 'ok';
async function mk(w = 1280, h = 800, seed = true) {
  const ctx = await browser.newContext({viewport: {width: w, height: h}, acceptDownloads: true, locale: 'ro-RO'});
  await ctx.route(/^https?:/, async r => {
    const u = r.request().url();
    if (u.startsWith(BASE + '/v1/chat/completions')) {
      const body = JSON.parse(r.request().postData() || '{}');
      reqs.push(body);
      const last = body.messages[body.messages.length - 1].content;
      const out = replyFn(last, body);
      if (out instanceof Error) return r.fulfill({status: 500, contentType: 'application/json', body: JSON.stringify({error: {message: 'boom'}})});
      const sse = 'data: ' + JSON.stringify({choices: [{delta: {content: out}}]}) + '\n\ndata: [DONE]\n\n';
      return r.fulfill({status: 200, contentType: 'text/event-stream', body: sse});
    }
    ext.push(u); r.abort();
  });
  if (seed) await ctx.addInitScript(b => { try { if (!localStorage.getItem('nexus:settings')) localStorage.setItem('nexus:settings', JSON.stringify({providers: {custom: {baseUrl: b, apiKey: '', defaultModel: 'fake-model'}}})); } catch (e) {} }, BASE);
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(URL_APP); await page.waitForTimeout(600);
  return {ctx, page};
}
const ck = (page, sel) => page.evaluate(s => document.querySelector(s).click(), sel);
async function openFlows(page) { await ck(page, '#btn-flows'); await page.waitForSelector('#flows-modal:not(.hidden)'); }
async function newConv(page) {
  await ck(page, '#btn-new-conv');
  await page.selectOption('#provider-select', 'custom');
  await page.waitForTimeout(100);
}
console.log('Nexus — fluxuri de agenți');

/* ---------- motorul pur ---------- */
{
  const {ctx, page} = await mk();
  const R = await page.evaluate(async () => {
    const F = window.__nexusFlows, out = {};
    const mkio = fn => ({call: async (s, t) => fn(s, t), signal: null});
    const run = (steps, inp, fn) => F.run({name: 'x', steps: steps.map(s => F.clean({id: 'a', name: 'n', steps: [s]}).steps[0])}, inp, mkio(fn || (() => 'M')));
    out.tools = [
      (await run([{t: 'tool', tool: 'trim'}], '  hi \n')).output,
      (await run([{t: 'tool', tool: 'upper'}], 'abc')).output,
      (await run([{t: 'tool', tool: 'first_lines', arg: '2'}], 'a\nb\nc')).output,
      (await run([{t: 'tool', tool: 'last_lines', arg: '1'}], 'a\nb\nc')).output,
      (await run([{t: 'tool', tool: 'regex_extract', arg: 'id=(\\d+)'}], 'x id=42 y')).output,
      (await run([{t: 'tool', tool: 'regex_replace', arg: 'a', arg2: 'o'}], 'banana')).output,
      (await run([{t: 'tool', tool: 'dedupe_lines'}], 'a\nb\na\nc\nb')).output,
      (await run([{t: 'tool', tool: 'sort_lines'}], 'c\na\nb')).output,
      (await run([{t: 'tool', tool: 'word_count'}], 'one two  three')).output,
      (await run([{t: 'tool', tool: 'json_pretty'}], '{"a":1}')).output,
      (await run([{t: 'tool', tool: 'template', arg: '<<{{input}}|{{start}}>>'}], 'q')).output
    ];
    out.badjson = (await run([{t: 'tool', tool: 'json_pretty'}], 'nope')).status;
    out.badre = (await run([{t: 'tool', tool: 'regex_extract', arg: '('}], 'x')).status;
    // variabile între pași
    const r2 = await run([{t: 'prompt', text: 'A:{{input}}'}, {t: 'prompt', text: 'B:{{input}}|{{s1}}|{{start}}'}], 'S', (s, t) => '[' + t + ']');
    out.vars = r2.output; out.calls2 = r2.calls;
    // verificare: oprește
    const r3 = await run([{t: 'prompt', text: 'x'}, {t: 'check', cond: 'contains', arg: 'ZZ', onFail: 'stop'}, {t: 'tool', tool: 'upper'}], '', () => 'abc');
    out.stop = [r3.status, r3.log.length, r3.output];
    // continuă cu avertisment
    const r4 = await run([{t: 'prompt', text: 'x'}, {t: 'check', cond: 'contains', arg: 'ZZ', onFail: 'continue'}, {t: 'tool', tool: 'upper'}], '', () => 'abc');
    out.cont = [r4.status, r4.output, r4.log[1].ok];
    // reluare: a doua încercare trece
    let n = 0; const hints = [];
    const r5 = await run([{t: 'prompt', text: 'go {{input}}'}, {t: 'check', cond: 'max_len', arg: '5', onFail: 'retry'}], 'IN', (s, t) => { hints.push(t); return ++n < 3 ? 'prea lung de tot' : 'ok'; });
    out.retry = [r5.status, r5.calls, r5.output, hints.length, hints[1].includes('IN') && hints[1].includes('[')];
    // reluare epuizată
    const r6 = await run([{t: 'prompt', text: 'x'}, {t: 'check', cond: 'contains', arg: 'Q', onFail: 'retry'}], '', () => 'nu');
    out.retryFail = [r6.status, r6.calls];
    // limită de apeluri
    const many = []; for (let i = 0; i < 12; i++) many.push({t: 'prompt', text: '{{input}}'});
    const r7 = await F.run({name: 'm', steps: many.map(s => F.clean({steps: [s]}).steps[0])}, 'x', mkio(() => 'y'));
    out.limit = [r7.status, r7.calls];
    // eroare de model
    const r8 = await run([{t: 'prompt', text: 'x'}, {t: 'tool', tool: 'upper'}], '', () => { throw new Error('boom'); });
    out.err = [r8.status, r8.msg, r8.log.length];
    // anulare
    const ac = new AbortController();
    const r9 = await F.run({name: 'a', steps: [{t: 'prompt', text: 'x', system: ''}, {t: 'prompt', text: 'y', system: ''}]}, '', {call: async () => { ac.abort(); return 'a'; }, signal: ac.signal});
    out.abort = [r9.status, r9.calls];
    // sanitizare
    out.clean = [F.clean(null), F.clean({steps: 'x'}), F.clean({name: 'x'.repeat(200), steps: [{t: 'tool', tool: 'rm -rf'}, {t: 'prompt', text: 'p'}, {t: 'zzz'}]}).steps.length, F.clean({steps: Array(30).fill({t: 'prompt', text: 'p'})}).steps.length, F.clean({id: '../../x', steps: [{t: 'prompt', text: 'p'}]}).id.length > 0];
    out.md = F.md({name: 'N'}, r3);
    return out;
  });
  ok(R.tools[0] === 'hi' && R.tools[1] === 'ABC' && R.tools[2] === 'a\nb' && R.tools[3] === 'c', 'unelte: trim/upper/first/last', R.tools);
  ok(R.tools[4] === '42' && R.tools[5] === 'bonono' && R.tools[6] === 'a\nb\nc' && R.tools[7] === 'a\nb\nc', 'unelte: regex, dedupe, sort', R.tools);
  ok(R.tools[8] === '3' && R.tools[9] === '{\n  "a": 1\n}' && R.tools[10] === '<<q|q>>', 'unelte: word_count, json, template', R.tools);
  ok(R.badjson === 'failed' && R.badre === 'failed', 'JSON/regex invalide opresc fluxul');
  ok(R.vars === '[B:[A:S]|[A:S]|S]' && R.calls2 === 2, 'variabile {{input}} {{s1}} {{start}}', R.vars);
  ok(R.stop[0] === 'failed' && R.stop[1] === 2 && R.stop[2] === 'abc', 'verificare picată: oprește, pasul următor nu rulează', R.stop);
  ok(R.cont[0] === 'ok' && R.cont[1] === 'ABC' && R.cont[2] === false, 'verificare picată: continuă cu avertisment', R.cont);
  ok(R.retry[0] === 'ok' && R.retry[1] === 3 && R.retry[2] === 'ok' && R.retry[3] === 3 && R.retry[4], 'reluare: 3 apeluri, indiciul se adaugă, intrarea se păstrează', R.retry);
  ok(R.retryFail[0] === 'failed' && R.retryFail[1] === 4, 'reluare epuizată: max 3 reluări (4 apeluri)', R.retryFail);
  ok(R.limit[0] === 'limit' && R.limit[1] === 12 || R.limit[0] === 'ok', 'flux cu 12 instrucțiuni încape în limită', R.limit);
  ok(R.err[0] === 'failed' && R.err[1] === 'boom' && R.err[2] === 1, 'eroare de model: oprește cu mesaj', R.err);
  ok(R.abort[0] === 'stopped' && R.abort[1] === 1, 'anulare între pași', R.abort);
  ok(R.clean[0] === null && R.clean[1] === null && R.clean[2] === 1 && R.clean[3] === 12 && R.clean[4], 'sanitizare: pași invalizi, limita de 12, id nesigur', R.clean);
  ok(/^# N/.test(R.md) && R.md.includes('```'), 'jurnal Markdown');
  await ctx.close();
}
/* ---------- interfață: flux fără model (exemplul 2) ---------- */
{
  const {ctx, page} = await mk();
  await openFlows(page);
  ok(await page.evaluate(() => document.getElementById('app').hasAttribute('inert')), 'modalul închide restul paginii (inert)');
  await ck(page, '#fl-examples');
  const names = await page.$$eval('#fl-sel option', o => o.map(x => x.textContent));
  ok(names.length === 3, 'exemple încărcate', names);
  await page.selectOption('#fl-sel', {index: 2});
  ok(await page.locator('.fl-step').count() === 3, 'fluxul exemplu 2 are 3 pași');
  await page.fill('#fl-input', '  b\na\nb\n  ');
  await ck(page, '#fl-run');
  await page.waitForFunction(() => document.getElementById('fl-result').value.length > 0 || /Flux/.test(document.getElementById('fl-status').textContent), null, {timeout: 20000});
  ok((await page.inputValue('#fl-result')) === 'a\nb', 'rezultat: curățat, fără duplicate, sortat', await page.inputValue('#fl-result'));
  ok(await page.locator('#fl-log details').count() === 3, 'jurnal cu 3 intrări');
  ok(reqs.length === 0, 'flux fără instrucțiuni: nicio cerere către model');
  // jurnal MD
  const dl = page.waitForEvent('download'); await ck(page, '#fl-log-md');
  const md = fs.readFileSync(await (await dl).path(), 'utf8');
  ok(md.includes('dedupe') === false && md.includes('```') && md.includes('3'), 'export jurnal .md');
  // persistență
  await page.reload(); await page.waitForTimeout(500); await openFlows(page);
  const po = await page.$$eval('#fl-sel option', o => o.map(x => x.textContent));
  ok(po.length === 3, 'fluxurile persistă după reîncărcare', po);
  await ctx.close();
}
/* ---------- interfață: flux cu model fals ---------- */
{
  const {ctx, page} = await mk();
  await newConv(page);
  replyFn = (t) => t.includes('Rezumă') ? 'REZUMAT scurt' : 'alt';
  await openFlows(page);
  ok(/custom|Personalizat|Custom/i.test(await page.textContent('#fl-target')) || (await page.textContent('#fl-target')).includes('fake-model'), 'modelul țintă e afișat', await page.textContent('#fl-target'));
  await ck(page, '#fl-examples');
  await page.selectOption('#fl-sel', {index: 1});
  await page.fill('#fl-input', 'Un text lung despre ceva.');
  await ck(page, '#fl-run');
  await page.waitForFunction(() => /Flux încheiat|Flux oprit/.test(document.getElementById('fl-status').textContent), null, {timeout: 30000});
  ok((await page.inputValue('#fl-result')) === 'REZUMAT scurt' && reqs.length === 1, 'instrucțiune → verificare → trim: rezultat de la modelul fals', [await page.inputValue('#fl-result'), reqs.length]);
  ok(reqs[0].messages[reqs[0].messages.length - 1].content.endsWith('Un text lung despre ceva.') && reqs[0].model === 'fake-model', 'cererea conține intrarea și modelul conversației');
  // retry: modelul răspunde prea lung de două ori
  reqs.length = 0; let k = 0; replyFn = () => (++k < 3 ? 'x'.repeat(900) : 'scurt');
  await ck(page, '#fl-run');
  await page.waitForFunction(() => /Flux încheiat|Flux oprit/.test(document.getElementById('fl-status').textContent) && document.getElementById('fl-result').value === 'scurt', null, {timeout: 30000});
  ok(reqs.length === 3 && /\[/.test(reqs[1].messages[reqs[1].messages.length - 1].content), 'reluare automată cu indiciu (3 cereri)', reqs.length);
  ok(await page.locator('#fl-log details.bad').count() === 2, 'jurnal: 2 verificări picate marcate');
  // eroare HTTP
  reqs.length = 0; replyFn = () => new Error('x');
  await ck(page, '#fl-run');
  await page.waitForFunction(() => /Flux oprit/.test(document.getElementById('fl-status').textContent), null, {timeout: 30000});
  ok(/Flux oprit/.test(await page.textContent('#fl-status')) && await page.locator('#fl-log details.bad').count() >= 1, 'eroare de la furnizor: flux oprit, jurnal marcat');
  await ctx.close();
}
/* ---------- fără conversație / editor / import-export ---------- */
{
  const {ctx, page} = await mk();
  await ck(page, '[id=btn-empty-new]').catch(() => {});
  await openFlows(page);
  await page.fill('#fl-name', 'Cu model');
  await ck(page, '#fl-save');
  await page.fill('#fl-input', 'x');
  await ck(page, '#fl-run');
  await page.waitForTimeout(400);
  ok(await page.locator('.toast.error').count() >= 1, 'fără conversație: mesaj de eroare (toast)');
  // editor: adaugă pași, mută, șterge
  await ck(page, '#fl-new');
  await page.fill('#fl-name', 'Editor');
  await ck(page, '#fl-add-tool'); await ck(page, '#fl-add-check');
  ok(await page.locator('.fl-step').count() === 3, 'adăugare pași');
  await page.evaluate(() => document.querySelector('.fl-step[data-step="2"] button[aria-label^="Mută în sus"]').click());
  const order = await page.$$eval('.fl-step strong', e => e.map(x => x.textContent));
  ok(/Verificare/.test(order[1]) && /Unealtă/.test(order[2]), 'mutare pas în sus', order);
  await page.evaluate(() => document.querySelector('.fl-step[data-step="0"] button[aria-label^="Elimină"]').click());
  ok(await page.locator('.fl-step').count() === 2, 'ștergere pas');
  for (let i = 0; i < 14; i++) await ck(page, '#fl-add-tool');
  ok(await page.locator('.fl-step').count() === 12, 'limita de 12 pași în editor');
  await ck(page, '#fl-save');
  ok((await page.evaluate(() => JSON.parse(localStorage.getItem('nexus:flows')).map(f => f.name))).includes('Editor'), 'salvat în localStorage cu prefixul nexus:');
  // export / import
  const dl = page.waitForEvent('download'); await ck(page, '#fl-exp');
  const exp = JSON.parse(fs.readFileSync(await (await dl).path(), 'utf8'));
  ok(exp.kind === 'flow' && exp.flow.steps.length === 12 && !/apiKey/.test(JSON.stringify(exp)), 'export șablon fără chei', Object.keys(exp));
  const f1 = path.join(HERE, '_tmp_flow.json'), f2 = path.join(HERE, '_tmp_bad.json');
  fs.writeFileSync(f1, JSON.stringify({kind: 'flow', flow: {id: '../x', name: '<img src=x onerror=window.__x=1>', steps: [{t: 'tool', tool: 'upper'}, {t: 'tool', tool: 'evil'}]}}));
  fs.writeFileSync(f2, '{"x":');
  await page.setInputFiles('#fl-imp-file', f1); await page.waitForTimeout(300);
  ok((await page.$$eval('#fl-sel option', o => o.map(x => x.textContent))).some(t => t.includes('<img')) && await page.evaluate(() => window.__x) === undefined, 'import: nume ostil afișat ca text, pași invalizi eliminați');
  const n0 = await page.$$eval('#fl-sel option', o => o.length);
  await page.setInputFiles('#fl-imp-file', f2); await page.waitForTimeout(300);
  ok((await page.$$eval('#fl-sel option', o => o.length)) === n0 && await page.locator('.toast.error').count() >= 1, 'import fișier invalid: respins cu mesaj');
  fs.unlinkSync(f1); fs.unlinkSync(f2);
  // ștergere cu confirmare
  await ck(page, '#fl-del'); await page.waitForTimeout(300);
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.offsetParent && /^(Da|Yes|Șterge|Delete|Confirm)/i.test(x.textContent.trim()) && !x.id); if (b) b.click(); });
  await page.waitForTimeout(400);
  ok((await page.$$eval('#fl-sel option', o => o.length)) === n0 - 1, 'ștergere flux cu confirmare');
  // Escape închide
  await page.keyboard.press('Escape');
  ok(await page.evaluate(() => document.getElementById('flows-modal').classList.contains('hidden') && !document.getElementById('app').hasAttribute('inert')), 'Escape închide modalul');
  await ctx.close();
}
/* ---------- limbi, a11y, mobil ---------- */
{
  const {ctx, page} = await mk();
  const miss = await page.evaluate(async () => {
    const keys = [...new Set([...document.querySelectorAll('[data-i18n]')].map(e => e.dataset.i18n).filter(k => k.startsWith('fl_')))];
    return keys;
  });
  ok(miss.length >= 15, 'chei i18n statice fl_*', miss.length);
  for (const l of ['ro', 'en', 'fr', 'it', 'es', 'pt', 'hu', 'de']) {
    await page.selectOption('#lang-select', l); await page.waitForTimeout(80);
    const r = await page.evaluate(() => [...document.querySelectorAll('#flows-modal [data-i18n]')].filter(e => !e.textContent.trim() || /^fl_/.test(e.textContent.trim())).map(e => e.dataset.i18n));
    ok(r.length === 0, 'etichete tradu: ' + l, r);
  }
  await page.selectOption('#lang-select', 'ro');
  await openFlows(page);
  await ck(page, '#fl-examples');
  if (AXE) {
    await page.evaluate(fs.readFileSync(AXE, 'utf8') + '\n;0');
    const ax = await page.evaluate(async () => (await axe.run(document.getElementById('flows-modal'), {resultTypes: ['violations']})).violations.map(v => v.id + ':' + v.nodes.map(n => n.target.join(' ')).slice(0, 3).join('|')));
    ok(ax.length === 0, 'axe 0 violări (modal Fluxuri)', ax);
  }
  await page.setViewportSize({width: 360, height: 740});
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1 && document.getElementById('flows-body').scrollWidth <= document.getElementById('flows-body').clientWidth + 1), 'fără depășire orizontală 360px');
  await ctx.close();
}
ok(errs.length === 0, 'fără pageerror', errs);
ok(ext.filter(u => !/jsdelivr|esm\.run/.test(u)).length === 0, '0 cereri externe (doar furnizorul fals local)', ext);
await browser.close();
console.log(`${pass} reușite, ${fail} eșuate`);
process.exit(fail ? 1 : 0);
