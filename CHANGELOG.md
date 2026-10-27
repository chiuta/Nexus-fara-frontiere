# Jurnal de modificări

## 2.2.0 — 2026-10-27

### Adăugat
- **Traduceri pentru componenta de protecție cu parolă** (cardul și dialogurile de creare/deblocare/confirmare, inclusiv avertismentul „neauditat”) în **fr, it, es, pt, de, hu** — traduceri automate, neverificate de vorbitori nativi. Până acum aceste limbi cădeau pe engleză. Doar textele din `KeyVault UI`; **logica criptografică nu s-a modificat** (nucleul `KeyVault 1.0.0` este identic octet cu octet).
- Avertismentul „în clar” (`w3`) din Setări menționează acum criptarea opțională în toate cele 8 limbi (lipsea în fr/it/es/pt/de/hu).
- Test nou: `tests/keyvault-i18n.test.mjs` (fără chei netraduse, avertismentul numește AES-256-GCM și iterațiile, textul diferă de engleză, 0 cereri de rețea).
- `sizeBytes`/`sha256` din `app.json` și `fff-info` regenerate cu uneltele fff-kit (`fixcsp`, `info`, `check --lax`).

### Neimplementat
- README-urile în fr/it/es/pt/de/hu au doar versiunea actualizată.
- Fără audit extern al componentei: rămâne marcată „neauditată”.

## 2.1.0 — 2026-10-27

Recenzie 2026-10-27.

### Adăugat
- Criptare opțională cu parolă a cheilor API (WebCrypto AES-256-GCM + PBKDF2-SHA256, 600 000 de iterații, sare aleatoare), în Setări. Implicit oprită; migrare opțională în ambele sensuri, fără pierderea cheilor existente. Componentă neauditată de un terț (avertisment în aplicație și în README).
- Notă „Vezi și AI Liber” în Setări și secțiune în README despre diferența dintre Nexus și AI Liber.
- Teste noi: `tests/keyvault-core.test.mjs`, `tests/keyvault-ui.test.mjs`.
- Linii „Stare” și „Offline” în README și metadate (`app-status`, `app-offline`).

### Modificat
- Avertismentul despre chei menționează noua opțiune. Hash-urile CSP ale scripturilor inline au fost recalculate.

### Neschimbat
- Nimic șters; fără dependențe noi, fără gazde noi în CSP.

Istoricul anterior (până la 2.0.0, 2026-10-26) este în secțiunea „Istoric / Changelog” din README.md.
