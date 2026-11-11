---
created: "2026-11-06"
updated: "2026-11-06 13:08"
lastChange: "Vytvořen popis bezpečnostních opatření, jejich předpokladů a vědomě neřešených oblastí."
tags:
  - aplikace
  - bezpecnost
---

# Bezpečnost

Aplikace řeší základní bezpečnost v rozsahu, který odpovídá malé kavárně, a část věcí vědomě odkládá (PDF s. 11, kap. 8). Dokument popisuje, na čem ochrana stojí, aby ji úpravy nerozbily, a co chybí.

## Pravidla a záměr

- **Escapování je výchozí.** `{{ }}` escapuje znaky `& < > " '`, takže hodnota je bezpečná v textu i v atributu. Platí to i pro potvrzovací text se jménem hosta v atributu `data-confirm` v administraci (PDF s. 8, s. 11; `escapeHtml`, `src/lib/template.js:18–28`; `src/views/partials/admin-row.html:8`).
- **`{{{ }}}` jen pro HTML ze serveru.** Tato syntaxe vkládá bez escapování. Smí dostat jen HTML, které server sám složil z escapovaných fragmentů: obsah stránky v layoutu, nabídku dnů a řádky tabulky (PDF s. 8; `src/lib/template.js:96–101`; `src/routes/pages.js:33`; `src/routes/admin.js:61`).
- **Escapování nechrání adresy v `href`.** Schéma `javascript:` jím projde. Do odkazů se dnes dosazuje jen konfigurace a telefon, který prošel validací (`src/views/partials/admin-row.html:5`; `src/views/partials/footer.html:19–26`). Nová hodnota od uživatele v odkazu by potřebovala vlastní kontrolu.
- Šablona nedosáhne na prototyp objektu (`lookup`, `src/lib/template.js:30–41`).
- **SQL dotazy jsou parametrizované** a všechny jsou v jediném repozitáři (`src/db/reservations-repository.js:15–24`).
- **Ochrana proti path traversal.** Cesta ke statickému souboru se dekóduje, nulový bajt se odmítne a výsledná cesta musí ležet uvnitř `src/assets`. U šablon je povolená jen omezená sada znaků v názvu a platí stejná kontrola složky (PDF s. 11; `src/lib/static.js:24–39`; `src/lib/template.js:52–60`).
- **Tělo požadavku má limit 10 kB** pro JSON i formuláře (`src/lib/http.js:3, 15–48`).
- **Session cookie** má příznaky `HttpOnly`, `SameSite=Strict` a `Path=/admin`. Data se mění jen přes POST (PDF s. 11; `src/routes/admin.js:15, 107–112`). Porovnání hesla v konstantním čase popisuje [administrace.md](administrace.md).

## Rozhodnutí a omezení

Co aplikace podle PDF vědomě neřeší (s. 11 „Vědomě neřeší“) a co z toho plyne:

- **Heslo je v konfiguraci v plain textu a je jedno pro všechny** (`src/config.js:24–25`).
- **Chybí CSRF tokeny.** Mazání a odhlášení chrání jen cookie se `SameSite=Strict` a to, že změny jdou přes POST. Změnová akce přes GET nebo uvolnění `SameSite` by tuto ochranu zrušily.
- **Chybí rate limiting přihlášení.**
- **Chybí HTTPS a bezpečnostní hlavičky (CSP).** Cookie nemá příznak `Secure`. Funkce `setCookie` ho nastavit umí, administrace ho ale nepoužívá (`src/lib/http.js:102`; `src/routes/admin.js:15`).
- **Chybí perzistentní session, strukturované logy a CI.** Log je jeden řádek na požadavek do konzole (PDF s. 8; `src/app.js:14–17`).
- Osobní údaje se uchovávají bez časového omezení, viz [administrace.md](administrace.md).

## Rozpory a otevřené otázky

- **Chyba 500 v API vrací text výjimky.** Odpověď obsahuje `message` s textem interní výjimky (`src/app.js:41`). PDF to nezmiňuje. Otevřená otázka: je to záměr, nebo se má text výjimky skrýt?

## Zdroje

- [docs/kavarna-holubnik.pdf](../kavarna-holubnik.pdf): s. 8 „Zpracování požadavku“ a „Šablonovací engine“; s. 11, kap. 8 Bezpečnost a omezení („Řeší“, „Vědomě neřeší“, „Funkční omezení aktuální verze“).
- Kód: [src/lib/template.js](../../src/lib/template.js), [src/lib/static.js](../../src/lib/static.js), [src/lib/http.js](../../src/lib/http.js), [src/app.js](../../src/app.js), [src/routes/admin.js](../../src/routes/admin.js), [src/routes/pages.js](../../src/routes/pages.js), [src/db/reservations-repository.js](../../src/db/reservations-repository.js), [src/views/partials/admin-row.html](../../src/views/partials/admin-row.html), [src/views/partials/footer.html](../../src/views/partials/footer.html), [src/config.js](../../src/config.js).
