---
created: "2026-11-06"
updated: "2026-11-06 13:08"
lastChange: "Vytvořen popis odpovědnosti vrstev, chybových odpovědí, časového pásma, šablon, dat a technických rozhodnutí."
tags:
  - aplikace
  - architektura
---

# Architektura a technické řešení

Aplikace je čistý JavaScript (ES moduly) na Node.js bez frameworku, build kroku a npm závislostí. Data ukládá do SQLite přes vestavěný modul `node:sqlite`. Vrstvy jsou oddělené podle odpovědnosti: HTTP, routy, pravidla, SQL, šablony a kód pro prohlížeč (PDF s. 7, kap. 6). Strukturu adresářů, syntaxi šablon a spuštění popisuje [README](../../README.md). Tento dokument uvádí jen to, co z README ani z kódu na první pohled nevyplývá.

## Pravidla a záměr

### Odpovědnost vrstev

- **Pravidla jsou jen ve službě.** Handler API převádí chyby služby na stavové kódy a ostatní chyby nechá na `app.js` (PDF s. 8 „Zpracování požadavku“; `sendServiceError`, `src/routes/reservations-api.js:5–15`).
- **SQL je jen v repozitáři** a všechny dotazy jsou parametrizované (PDF s. 8 „Vrstvy a soubory“; `src/db/reservations-repository.js:15–24`).
- **Služba dostává závislosti i aktuální čas zvenčí.** Repozitář, otevírací doba, kapacita a rozsah dnů se předávají při jejím vytvoření. Čas `now` dostává každá funkce zvlášť: handlery předávají `new Date()`, testy pevný čas. Důvodem jsou deterministické testy (PDF s. 5 „Funkce služby“; `src/server.js:12–18`).

### Zpracování požadavku a chybové odpovědi

Požadavek projde nejdřív obsluhou statických souborů, potom routerem. Když nic neodpovídá, vrátí se 404, a neošetřená chyba skončí jako 500 (PDF s. 8; `handleRequest`, `src/app.js:63–86`).

- Statické soubory se obsluhují jen pod `/assets/` a jen pro GET a HEAD. Neexistující soubor nevyvolá chybu, požadavek propadne do routeru a skončí jako 404 (`src/lib/static.js:42–61`).
- Router hledá shodu metody i cesty. Jiná metoda na existující cestě proto vrací také 404, ne 405 (`src/lib/router.js:40–54`).
- 404 vrací pro `/api/*` JSON, jinak HTML stránku (`src/app.js:10–12, 19–26`).
- Chybu se stavovým kódem (`HttpError`) převede `app.js` na odpověď. Neošetřená chyba vrátí 500 a zapíše se do konzole (`src/app.js:28–54`; `src/lib/http.js:6–12`).
- JSON API vrací tyto chyby:
  - 400 `validation` s chybami u polí (`fields`): neplatné údaje nebo den mimo rozsah, vzniká ve službě.
  - 409 `slot_full` s hláškou: plný slot, vzniká ve službě.
  - 400, 413 a 415 `bad_request` s hláškou: neplatný JSON, tělo nad 10 kB nebo nepodporovaný typ obsahu. Vzniká při čtení těla ještě před voláním služby (`readBody`, `src/lib/http.js:15–48`).
  - 500 `server_error` s textem výjimky (`src/app.js:41`), viz [bezpecnost.md](bezpecnost.md).

  Jak na tyto odpovědi reaguje rezervační formulář, popisuje [rezervace.md](rezervace.md).

### Časové pásmo

Toto pravidlo platí pro celou aplikaci.

- Všechny časy jsou v místním čase procesu: „dnes“, sloty, rozsah dnů i `created_at`. `src/server.js` a `src/db/seed.js` ho nastavují na `config.timezone` (Europe/Prague) přes `process.env.TZ` (PDF s. 5, s. 9 „Konfigurace“; `src/server.js:9–10`; `src/db/seed.js:8`; `src/lib/dates.js:1–2`). Výchozí hodnota `created_at` z SQLite (`datetime('now', 'localtime')`) se změnou `TZ` za běhu řídí také, ověřeno v Node 24.
- **Pozor na pořadí načtení modulů.** Importy ES modulů se vyhodnotí dřív, než `server.js` nastaví `TZ`. Kód na úrovni modulu proto nesmí zafixovat časové pásmo. Právě kvůli tomu `dates.js` vytváří `Intl.DateTimeFormat` až při každém volání (`src/lib/dates.js:6–10`).
- Nový vstupní bod, například skript nebo úloha, musí `TZ` nastavit sám. Testy ho nenastavují a pevný čas zadávají v místním čase stroje (`tests/reservation-service.test.js:12`).
- Datum a hodina rezervace se ukládají jako místní hodnoty bez zóny. Rozdíl dní se počítá přes kalendářní data v UTC, aby ho nerozbil přechod na letní čas (`daysBetween`, `src/lib/dates.js:43–48`).

### Šablonovací engine

- **Nejdřív fragmenty, potom proměnné.** Engine nejprve rekurzivně vloží všechny fragmenty `{{> … }}` a teprve potom v jednom průchodu dosadí proměnné. Dosazená hodnota se znovu neprochází, takže data (třeba jméno hosta) nemohou vložit fragment ani další proměnnou. Ze stejného důvodu nejde fragment vybrat podle dat (`renderTemplate`, `src/lib/template.js:91–94`; `substituteVariables`, ř. 43–47).
- Název fragmentu musí odpovídat `^[a-z0-9/-]+$` a soubor musí ležet uvnitř `src/views`. Vnoření je omezené na 10 úrovní, což chrání před cyklem (PDF s. 8 „Šablonovací engine“; ř. 11–12, 52–89).
- **Chybějící proměnná se vykreslí jako prázdný řetězec**, bez chyby. Překlep v názvu proměnné tedy nevyvolá výjimku. Engine bere jen vlastní vlastnosti objektu, šablona proto nedosáhne na prototyp (`lookup`, ř. 30–41).
- Kontext vždy obsahuje globální `cafe`, `openingHours`, `year` a `currentPath` a data handleru je mohou přepsat (PDF s. 8; ř. 96–101, 111–123).
- **Podmíněný obsah přes `:empty`.** Engine nemá podmínky ani cykly (viz README), proto handler předá prázdný řetězec a CSS prázdný prvek skryje pravidlem `:empty`. Takhle fungují chybové hlášky formulářů, stav a seznam slotů i hlášky administrace (`src/routes/admin.js:61–64`; `src/assets/css/styles.css:905, 1012, 1022, 1134`; `src/assets/css/admin.css:214–216, 240`). Pravidla pro bezpečné použití `{{{ }}}` popisuje [bezpecnost.md](bezpecnost.md).
- Šablony se čtou z disku při každém požadavku, změny jsou vidět bez restartu. Konfigurace se naproti tomu načte jen při startu (PDF s. 8; ř. 62–63).

### Data

- Jediná tabulka `reservations` má index na datum a hodinu, podle kterého se počítá obsazenost slotů. Rezervace nemá stav, mazání je fyzické a host není samostatná entita (PDF s. 9 „Datový model“; `src/db/schema.sql`).
- **Schéma se aplikuje při každém startu** (`CREATE … IF NOT EXISTS`) a migrace neexistují. Existující tabulku tak změnit nejde, například přidat sloupec pro počet osob (PDF s. 9; `src/db/database.js:27`).
- Databáze běží v režimu WAL a s `busy_timeout` 5 s kvůli souběhu se seedem. Testy používají `:memory:`, kde se WAL nezapíná (`src/db/database.js:12–29`).
- Souběh a transakce při vytváření rezervace popisuje [rezervace.md](rezervace.md).

## Rozhodnutí a omezení

Zdůvodnění zásadních technických rozhodnutí podle PDF (s. 10–11 „Zásadní technická rozhodnutí“). PDF požaduje, aby je nové funkce respektovaly a aby se každá změna zapsala do `DECISIONS.md` i s důvodem.

- **Node.js server (`node:http`):** rezervace a administrace potřebují sdílené úložiště.
- **Čistý JavaScript bez build kroku:** nejjednodušší spuštění, bez kompilace.
- **SQLite přes `node:sqlite`, bez frameworků a npm závislostí:** nic se neinstaluje a kód zůstává vlastní a přehledný. Proto aplikace vyžaduje Node.js 22.13 nebo novější (PDF s. 10 „Spuštění“; `package.json`).
- **Skládání HTML z fragmentů na serveru:** fragmenty se snadno spravují a prohlížeč dostane hotové HTML.
- **Konfigurace včetně hesla v `src/config.js`:** pro demo záměrné zjednodušení.
- **Web v `src`, data a testy v kořeni, oddělené CSS pro administraci:** databáze a testy nejsou součástí webu a administrace má jiný vzhled.
- **Fotky generované AI:** realistický vzhled bez licenčních omezení.

Testy pokrývají jen šablony a službu. Sada má 32 testů v 6 skupinách a testuje šablonovací engine a rezervační službu nad `:memory:` s pevným časem (PDF s. 10 „Testy“; `tests/`; ověřeno spuštěním `npm test`, prošlo 32 z 32). HTTP vrstvu, routy, session, administraci, kód pro prohlížeč ani souběh více procesů testy nepokrývají.

## Rozpory a otevřené otázky

- **`DECISIONS.md` chybí.** PDF i README na něj odkazují jako na místo se zásadními rozhodnutími, v repozitáři ale není. Rozhodnutí výše proto dokládá jen PDF a pravidlo zapisovat změny i s důvodem nemá kam zapisovat. Otevřená otázka: má `DECISIONS.md` vzniknout z tabulky v PDF? Tento úkol ho nevytváří. Další chybějící dokumenty uvádí [prehled-aplikace.md](prehled-aplikace.md).

## Zdroje

- [docs/kavarna-holubnik.pdf](../kavarna-holubnik.pdf): s. 5 „Funkce služby“; s. 7–9, kap. 6 Architektura a technické řešení („Zpracování požadavku“, „Vrstvy a soubory“, „Šablonovací engine“, „Datový model“, „JSON API“); s. 9–11, kap. 7 Konfigurace, spuštění a testy („Konfigurace“, „Spuštění“, „Testy“, „Zásadní technická rozhodnutí“).
- Kód: [src/app.js](../../src/app.js), [src/server.js](../../src/server.js), [src/lib/http.js](../../src/lib/http.js), [src/lib/router.js](../../src/lib/router.js), [src/lib/static.js](../../src/lib/static.js), [src/lib/template.js](../../src/lib/template.js), [src/lib/dates.js](../../src/lib/dates.js), [src/routes/reservations-api.js](../../src/routes/reservations-api.js), [src/routes/admin.js](../../src/routes/admin.js), [src/db/database.js](../../src/db/database.js), [src/db/schema.sql](../../src/db/schema.sql), [src/db/reservations-repository.js](../../src/db/reservations-repository.js), [src/db/seed.js](../../src/db/seed.js), [src/assets/css/styles.css](../../src/assets/css/styles.css), [src/assets/css/admin.css](../../src/assets/css/admin.css), [tests/reservation-service.test.js](../../tests/reservation-service.test.js), [package.json](../../package.json), [README.md](../../README.md).
