# Nexus fără frontiere

[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · **Magyar**

**Verzió:** 1.2.0 · **Utolsó frissítés:** 2026-10-19

A felület nyelvei: **Română, English, Français, Italiano, Español, Português (PT), Deutsch, Magyar**

Személyes MI-csevegőközpont egyetlen HTML-fájlban: közvetlenül a böngészőből beszélgetsz az Anthropickal, az OpenAI-jal, a Google-lel vagy egy OpenAI-kompatibilis végponttal. **Nem offline alkalmazás**, és a kulcsaid titkosítatlanul a böngészőben vannak — olvasd el az „Adatvédelem és hálózat” szakaszt.

**Online alkalmazás:** https://chiuta.github.io/Nexus-fara-frontiere/

![Képernyőkép (bemutató beszélgetés)](screenshot.png)

## Mi ez

Saját szerver nélküli csevegőkliens: az oldalnak nincs backendje, nincsenek fiókjai, és nem küld telemetriát. Te adod meg a saját API-kulcsaidat, a kérések pedig közvetlenül a böngésződből mennek a kiválasztott szolgáltatóhoz. Hálózat és kulcs nélkül egyetlen modellel sem tudsz beszélgetni.

## Funkciók

A kódban és – ahol „teszt” áll – fej nélküli böngészőben (Chromium/Playwright) **szimulált** válaszokkal ellenőrizve — nem futtattam valódi hívásokat a szolgáltatók API-jaira.

- Négy szolgáltató: Anthropic (Messages API), OpenAI (Chat Completions), Google (Gemini `generateContent`) és „Egyéni” (bármely OpenAI-kompatibilis végpont: Ollama, LM Studio, OpenRouter stb.).
- SSE-streaming az Anthropic és az OpenAI/kompatibilis szolgáltatók esetén (teszt). **A Google nem streamel**: a válasz egészében, a végén jelenik meg.
- „Leállítás” gomb (megszakítja a kérést; a részleges szöveg megmarad, „leállítva” jelöléssel) és automatikus megszakítás 5 perc válasz nélkül.
- Ágensek (personák): Általános, Kód, Cowork, Kutatás + saját ágensek (név, rendszerprompt, szolgáltató, modell). **A „Kód” és a „Cowork” csak personák**: rendszerpromptok az API nyilvános modelljei fölött, nem integrációk a Codex vagy a Claude Cowork termékekkel.
- Saját, minimális Markdown: címsorok, listák, félkövér/dőlt, beágyazott kód és kódblokkok („Másolás” gombbal), `http(s)` hivatkozások. Táblázatok és képek nélkül. A válaszokban lévő minden HTML szövegként jelenik meg; a `![](…)` képek nem töltődnek be, így egy válasz nem indíthat kéréseket harmadik felek felé (teszt payloadokkal: `<img onerror>`, `javascript:`, nyers HTML, `<script>`, `<svg onload>`, `<iframe>`).
- Több beszélgetés a `localStorage`-ban, szerkeszthető cím, törlés; keresés az oldalsávban cím és szöveg szerint (ékezet- és kis-/nagybetű-független).
- A „⇩ MD” az aktuális beszélgetést Markdown-fájlként menti (kulcsok nélkül; a szövegben megjelenő kulcs el van fedve); a nyomtatás (Ctrl+P) csak az aktuális beszélgetést adja, fehér háttéren.
- JSON-export/-import (beszélgetések és ágensek, **kulcsok nélkül**), az importált fájl megtisztításával.
- A modellek listája szerkeszthető, és a szolgáltató API-jából újratölthető a te kulcsoddal.
- „Kulcs törlése” szolgáltatónként és „Minden helyi adat törlése”.
- Útmutatás az első használatnál: az üres állapot jelzi az API-kulcs hiányát, és egy gombbal megnyitja a Beállításokat; a beírt szöveg nem vész el, ha hiányzik a kulcs.
- Kifejezett hibaüzenetek 401, 403, 404, 429 (`Retry-After`-rel, ha a szolgáltató megadja), 5xx, a stream közepén fellépő hibák és hálózat/CORS/CSP esetén (teszt).

## Használati útmutató

1. Nyisd meg az oldalt (vagy helyben az `index.html` fájlt), és nyomd meg a **⚙ Beállítások** gombot.
2. Olvasd el a felül lévő figyelmeztetést, majd illeszd be a kívánt szolgáltató API-kulcsát (a „megjelenítés” gomb felfedi). Használj külön erre szolgáló, költési korláttal ellátott kulcsot.
3. Nyomd meg a **Kapcsolat tesztelése** gombot (minimális kérést küld, és az első szövegrésznél megszakítja).
4. Ha a javasolt modellnév már nem létezik, nyomd meg a **Modellek listájának frissítése** gombot, vagy írd be közvetlenül a nevet a „Modell” mezőbe.
5. Zárd be a Beállításokat, nyomd meg a **+ Új beszélgetés** gombot, válaszd ki a felső sávban az ágenst, a szolgáltatót és a modellt, és írd meg az üzenetet (az Enter küld, a Shift+Enter új sort ad).
6. A **Leállítás** megszakít egy folyamatban lévő választ.
7. Az **Exportálás** a beszélgetéseket és az ágenseket egy JSON-fájlba menti; az **Importálás** hozzáadja őket (nem cseréli) egy fájlból. Csak olyan fájlokat importálj, amelyekben megbízol: egy importált ágens promptja befolyásolja a modell válaszait.

## Adatvédelem és hálózat

**Ami a böngészőben marad**
- `localStorage`: a beszélgetések, az ágensek, a beállítások és **az API-kulcsok, nyílt szövegként (titkosítatlanul)**. Ha a `localStorage` blokkolt vagy tele van (pl. privát mód), az alkalmazás a memóriában fut, és figyelmeztet, hogy semmi sem mentődik.
- A kulcsokat bárki elolvashatja, akinek hozzáférése van a böngészőprofilhoz, rosszindulatú bővítmények, vagy egy esetleges XSS. Megtett intézkedések: CSP (lent), a válaszok teljes tartalma escape-elve van, az import megtisztított. Ezek nem szüntetik meg a kockázatot: ne használd az alkalmazást nyilvános/megosztott számítógépen, használj külön erre szolgáló kulcsokat, és gyanú esetén vond vissza őket.
- Az export nem tartalmaz kulcsokat (ellenőrizve; ha egy mentett kulcs mégis megjelenik egy beszélgetés szövegében, exportáláskor el van fedve). Az exportált beszélgetések bármit tartalmazhatnak, amit te írtál.

**Ami elhagyja a böngészőt, és hová** (csak amikor üzenetet küldesz, tesztelsz kapcsolatot vagy frissíted a modellek listáját)
- Anthropic: `https://api.anthropic.com/v1/messages` és `/v1/models`. A kulcs az `x-api-key` fejlécben megy.
- OpenAI: `https://api.openai.com/v1/chat/completions` és `/v1/models`. `Authorization: Bearer …` fejléc.
- Google: `https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent` és `/v1beta/models`. A kulcs az `x-goog-api-key` fejlécben megy (nem az URL-ben).
- Egyéni: a te URL-ed + `/v1/chat/completions` és `/v1/models`; a kulcs, ha megadsz egyet, Bearerként megy az adott URL-re. A `http://` csak a `localhost`/`127.0.0.1` esetén elfogadott.
- Minden üzenettel a szolgáltatóhoz kerül: a kulcs, az ágens rendszerprompja és a beszélgetés előzményei (az utolsó 100 üzenet, legfeljebb ~300 000 karakter; ha csonkolva van, az alkalmazás értesít). A kiválasztott szolgáltató adatkezelési szabályai érvényesek.
- Más gazdák nincsenek: nincs telemetria, CDN, külső betűtípus vagy szkript. A válaszokban lévő hivatkozások csak kattintásra nyílnak meg (`noopener noreferrer`), és az oldal `referrer: no-referrer` beállítást kér.

**Az `anthropic-dangerous-direct-browser-access` fejléc**: az Anthropic API alapértelmezés szerint elutasítja a böngészőből érkező CORS-hívásokat, éppen azért, mert egy weboldalon lévő kulcs kockázatos. A fejléc a te kifejezett megerősítésed arról, hogy elfogadod ezt a kockázatot. Az alkalmazás azért küldi, mert enélkül egyetlen HTML-fájlból nem tud az Anthropickal beszélni.

**Content-Security-Policy** (a `<meta>`-ban): a szkriptek csak az oldal szkriptjének hash-e alapján engedélyezettek (semmilyen `<script>`-befecskendezés nem fut le); a `connect-src` a három API-ra plusz a `localhost`/`127.0.0.1`-re (bármely port) korlátozódik; külső képek, betűtípusok, iframe-ek és űrlapok nélkül. A beágyazott stílusok engedélyezettek (`style-src 'unsafe-inline'`), mert az alkalmazás `style` attribútumokat generál.

### Külső egyéni végpont (OpenRouter, DeepSeek, Mistral stb.)

A szállított CSP-vel az egyéni végpont csak a `localhost`/`127.0.0.1` címen működik. Külső gazdához a CSP-t lazítani kell — ez pedig gyengíti a kulcsok védelmét (egy befecskendezett szkript elküldhetné a kulcsokat arra a gazdára, amíg a szkript futhat; a `script-src`-beli hash ezt megakadályozza, de a védelem egyrétegű). Ha mégis ezt szeretnéd:

1. Töltsd le az `index.html` fájlt, és nyisd meg szerkesztőben.
2. A `<meta http-equiv="Content-Security-Policy" …>` címkében add hozzá a gazdádat a `connect-src` értékhez, például `https://openrouter.ai`.
3. **Ne módosíts semmit a `<script>` blokkban**: a CSP-ben lévő hash többé nem egyezne, és az oldal nem indulna el. Ha módosítod a szkriptet, számold újra az SHA-256 hash-t, és cseréld le a `script-src`-ben.
4. Nyisd meg a fájlt helyben (vagy tedd közzé a saját másolatodat).

Ollama esetén: indítsd el az `OLLAMA_ORIGINS` változóval, amelyet az oldal eredetére (origin) állítasz (pl. `https://chiuta.github.io`), különben a böngésző blokkolja a választ (CORS). A HTTPS-en közzétett oldalról a böngészők kivételként engedélyezik a `http://localhost` címet; egy helyi hálózati `http://192.168.x.x` címet nem.

## Korlátok és figyelmeztetések

- A modellnevek gyakran változnak. Az alkalmazás javaslatait (Anthropic: `claude-sonnet-5-5`, `claude-opus-5-5`, `claude-haiku-5-5`, `claude-fable-5-1`; OpenAI: `gpt-6-astra`, `gpt-6.1-sol`, `gpt-6-luna`; Google: `gemini-3.8-flash`, `gemini-3.1-pro-preview`, `gemini-3.5-flash`, `gemini-3.1-flash-lite`) 2026-10-08-án kézzel ellenőriztem a hivatalos dokumentációkban, és elavultak lehetnek; nem vállalok garanciát sem az elérhetőségükre a te fiókodnál, sem a díjszabásra. Ha régebbi verziót használtál, a Beállításokban és a régi beszélgetésekben elmentett modellek már nem biztos, hogy léteznek: módosítsd őket.
- Nem teszteltem a valódi API-kkal (csak szimulált válaszokat használtam). Előfordulhatnak a szolgáltatók valódi sajátosságai (CORS bizonyos végpontokon, egyes modellek által elutasított paraméterek).
- Az Anthropicnál fix, 4096 kimeneti tokenes korlát. Nincsenek eszközhívások, mellékletek/képek, webes keresés.
- Hosszú beszélgetések: csak az utolsó üzenetek kerülnek elküldésre (lásd fent); a `localStorage` rendszerint ~5 MB — túllépéskor figyelmeztetést kapsz, és a beszélgetések már nem mentődnek: exportáld őket.
- Egy modell válasza lehet téves, kitalált vagy nem helyénvaló; ellenőrizd, mielőtt rá hagyatkozol. Egy megjelenített hivatkozás szövege eltérhet a valódi címtől (a cím egérrel fölé húzva jelenik meg, a `title`-ben).
- A hívások költségei a te terheid; az alkalmazás nem korlátozza a költést.
- Személyes projekt, „ahogy van” módon kínálva, garancia nélkül.

## Futtatás helyben / offline

Töltsd le az `index.html` fájlt, és nyisd meg a böngészőben. Az oldal internet nélkül elindul, de a csevegéshez hálózat (vagy helyi modell, pl. Ollama a `localhost` címen) kell.

## Előzmények / Changelog

### 1.1.0 — 2026-10-14
- Biztonsági mentés és adatcímkézés (fff-kit).

### 1.0.0 — 2026. október 12.
- A verzió és az utolsó frissítés dátuma megjelenik az alkalmazásban (az üzenetmező alatt).

### 2026.10.11. (harmadik frissítés) — 2026. október 11.
- Javítva: ha API-kulcs (vagy végpont/modell) nélkül küldted el az első üzenetet, a beírt szöveg elveszett; mostantól a beviteli mezőben marad, és az értesítés ezt jelzi.
- Az üres állapot egy „Beállítások megnyitása” gombbal ellátott induló lépést mutat, amíg egyik szolgáltatónál sincs elmentett kulcs (vagy végpont); eltűnik, ha hozzáadsz egyet.

### 2026.10.11. (második frissítés) — 2026. október 11.
- Keresés a beszélgetésekben (cím és szöveg), az aktuális beszélgetés exportálása Markdownba és nyomtatási stílus a beszélgetéshez.

### 2026.10.11. — 2026. október 11.
- Akadálymentesség: egyetlen h1 címsor a fő területen (az oldalsávban lévő mobilon el volt rejtve); axe-ellenőrzés szabálysértés nélkül 1280 és 360 px-en.
- A modelljavaslatok továbbra is a 2026-10-08-án ellenőrzöttek (a dátum megjelenik az alkalmazásban); 2026.10.11-én nem ellenőrizték újra őket — ellenőrizd a listát a Beállításokban vagy a „Modellek listájának frissítése” gombbal.

## Licenc

MIT — lásd a LICENSE fájlt.

## Szerző

Alexio — Alexandru-Ionuț Chiuță, kapcsolat: alexio@trom.tf

## Összefoglaló

A Nexus fără frontiere egyetlen fájlból álló, román nyelvű, több szolgáltatót támogató MI-csevegőkliens: Anthropic, OpenAI, Google Gemini vagy bármely OpenAI-kompatibilis végpont, közvetlenül a böngésződből hívva (SSE-streaming az Anthropic és az OpenAI-kompatibilis szolgáltatóknál; a Gemini nem streamel). Nincs szervere és telemetriája, de nem offline: az üzenetek és az előzmények közvetlenül a választott szolgáltatóhoz kerülnek, az API-kulcsok pedig titkosítatlanul a localStorage-ban vannak tárolva. Szigorú CSP korlátozza a kapcsolatokat a három API-ra plusz a localhostra; a külső egyéni végpontokhoz a CSP szerkesztése szükséges egy helyi másolatban (dokumentálva). A Markdownt egy kis, escape-elő megjelenítő rendereli (XSS-payloadok ellen tesztelve); az export nem tartalmaz kulcsokat. A „Kód” és a „Cowork” personák, nem integrációk. Csak szimulált API-válaszokkal tesztelve.
