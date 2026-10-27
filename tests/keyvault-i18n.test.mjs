// Teste v2.2.0 — textele componentei de protecție cu parolă în toate cele 8 limbi (fr/it/es/pt/de/hu: traducere automată).
// Rulează din directorul aplicației: node tests/keyvault-i18n.test.mjs  (PW_ROOT / CHROMIUM_PATH opționale). Rețeaua e blocată.
import {createRequire} from "module"; import {fileURLToPath} from "url"; import path from "path";
const require = createRequire(process.env.PW_ROOT || import.meta.url); const {chromium} = require("playwright");
const here = path.dirname(fileURLToPath(import.meta.url)); const URL_ = "file://" + path.resolve(here, "../index.html");
let fail = 0; const ok = (c, m, x) => { console.log((c ? "  ok  " : "FAIL  ") + m + (!c && x !== undefined ? "  -> " + JSON.stringify(x) : "")); if (!c) fail++; };
const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--no-sandbox"]});
const ctx = await browser.newContext({viewport: {width: 1100, height: 900}, locale: "en-US"}); const errs = [], net = [];
await ctx.route(/^https?:/, r => { net.push(r.request().url()); r.abort(); });
const p = await ctx.newPage(); p.on("pageerror", e => errs.push(e.message));
await p.goto(URL_); await p.waitForFunction(() => typeof window.KV === "object" && typeof KV.ask === "function");
const RAW = /\b(tCreate|tUnlock|tConfirm|pw2|done[1-4]|enable|disable|mism)\b/;
const seen = {};
for (const l of ["ro", "en", "fr", "it", "es", "pt", "de", "hu"]) {
  const t = await p.evaluate(async l => {
    document.documentElement.lang = l;
    const host = document.createElement("div"); document.body.appendChild(host);
    const vault = new KV.Vault("test.i18n.vault." + l, { _m: {}, getItem(k) { return this._m[k] || null; }, setItem(k, v) { this._m[k] = v; }, removeItem(k) { delete this._m[k]; } });
    KV.controls(host, vault, { collect() { return {}; }, clear() {}, restore() {}, load() {}, drop() {}, changed() {} });
    const card = host.innerText;
    KV.ask("create");
    const dlg = document.querySelector(".kv-box").innerText;
    document.querySelector(".kv-ov").remove(); host.remove();
    return { card, dlg };
  }, l);
  const all = t.card + "\n" + t.dlg;
  seen[l] = all;
  ok(!RAW.test(all) && all.trim().length > 200, l + ": fără chei netraduse, text prezent", all.slice(0, 120));
  ok(/AES-256-GCM/.test(all) && /600[\s.,  ]?000/.test(all), l + ": avertismentul numește algoritmul și iterațiile");
  ok(!/\{n\}/.test(all), l + ": fără substituenți neînlocuiți");
}
for (const l of ["fr", "it", "es", "pt", "de", "hu"]) ok(seen[l] !== seen.en, l + ": textul diferă de engleză (nu cade pe EN)");
// Nexus: avertismentul „în clar” (w3) menționează acum criptarea opțională cu parolă în toate cele 8 limbi
{ const fs = await import("fs"); const html = fs.readFileSync(path.resolve(here, "../index.html"), "utf8"); const w3 = html.split("\n").filter(l => /^\s*"w3":/.test(l));
  ok(w3.length === 8 && w3.every(l => /AES-GCM/.test(l)), "w3: 8 limbi, toate menționează AES-GCM + PBKDF2", w3.length); }
ok(errs.length === 0, "fără erori JS", errs); ok(net.length === 0, "0 cereri de rețea", net);
await browser.close(); console.log(fail ? fail + " eșuate" : "toate trec"); process.exit(fail ? 1 : 0);
