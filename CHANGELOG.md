# Jurnal de modificări

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
