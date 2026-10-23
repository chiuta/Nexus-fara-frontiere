// Teste de regresie pentru audit (1.2.7): ținte tactile ≥ 44 px, import sanitizat, ieșire randată fără HTML activ.
// Rulare: node tests/audit.test.mjs   (Playwright din /opt/node-tools, Chromium din /opt/pw-browsers; rețea blocată)
import {createRequire} from 'module'; import path from 'path'; import {fileURLToPath} from 'url';
const require = createRequire('/opt/node-tools/package.json'); const {chromium} = require('playwright');
const FILE = 'file://' + path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
let ok = 0, bad = 0; const t = (n, c, x) => { if (c) { ok++; console.log('  ok  ' + n); } else { bad++; console.log('  FAIL ' + n + (x !== undefined ? ' :: ' + JSON.stringify(x) : '')); } };
const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
async function open(touch) {
  const ctx = await b.newContext(touch ? {viewport: {width: 390, height: 800}, hasTouch: true, isMobile: true} : {viewport: {width: 1280, height: 800}});
  let net = 0; await ctx.route(/^https?:/, (r) => { net++; r.abort(); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(FILE); await p.waitForTimeout(1200); return {ctx, p, errs, net: () => net};
}
{ const {ctx, p, errs, net} = await open(true);
  const small = await p.evaluate(() => ['btn-open-sidebar', 'conv-title', 'persona-select', 'provider-select', 'model-input', 'btn-empty-new', 'btn-empty-settings'].map((id) => { const r = document.getElementById(id).getBoundingClientRect(); return r.width > 0 && (r.height < 43.5 || r.width < 43.5) ? id + ':' + Math.round(r.width) + 'x' + Math.round(r.height) : null; }).filter(Boolean));
  t('ținte tactile ≥ 44 px (390 px, touch)', small.length === 0, small);
  t('fără depășire orizontală', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0);
  t('0 erori, 0 cereri de rețea', errs.length === 0 && net() === 0, errs); await ctx.close(); }
{ const {ctx, p, errs} = await open(false);
  const hostile = {conversations: [{id: 'c1', title: '<img src=x onerror=window.__pwn=1>', messages: [
    {id: 'm1', role: 'user', content: 'salut'},
    {id: 'm2', role: 'assistant', content: '<img src=x onerror=window.__pwn=1> [x](javascript:window.__pwn=1) [ok](https://example.org/a"onmouseover="window.__pwn=1) **bold**'}]}],
    personas: [], providers: {anthropic: {apiKey: 'sk-ant-SECRET-1234567890'}}};
  await p.setInputFiles('#import-file', {name: 'i.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(hostile))});
  await p.waitForTimeout(600);
  await p.locator('.conv-main').first().click(); await p.waitForTimeout(300);
  const r = await p.evaluate(() => ({pwn: window.__pwn, imgs: document.querySelectorAll('#messages img, #conv-list img').length, js: document.querySelectorAll('#messages a[href^="javascript"]').length,
    bold: document.querySelectorAll('#messages strong').length, links: Array.from(document.querySelectorAll('#messages a')).map((a) => a.getAttribute('href')),
    onattrs: Array.from(document.querySelectorAll('#messages *, #conv-list *')).filter((e) => Array.from(e.attributes).some((a) => /^on/i.test(a.name))).length,
    keyStored: Object.keys(localStorage).some((k) => (localStorage.getItem(k) || '').indexOf('SECRET-1234567890') >= 0)}));
  t('HTML din titlu și mesaj nu devine activ (fără <img>, fără onerror)', r.pwn === undefined && r.imgs === 0 && r.onattrs === 0, r);
  t('linkul javascript: nu devine link; markdown-ul sigur funcționează', r.js === 0 && r.bold === 1, r);
  t('linkul cu ghilimele în URL nu injectează atribute', r.links.every((h) => /^https?:\/\//.test(h)) && r.onattrs === 0, r.links);
  t('importul nu aduce chei API', r.keyStored === false, r);
  t('0 erori', errs.length === 0, errs); await ctx.close(); }
await b.close(); console.log(`\n${ok} reușite, ${bad} eșuate`); process.exit(bad ? 1 : 0);
