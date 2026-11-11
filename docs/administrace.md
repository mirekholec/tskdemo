---
created: "2026-11-06"
updated: "2026-11-11 15:10"
lastChange: "Seznam rezervací zvýrazňuje dnešní rezervace a tlumeně zobrazuje dnešní, které už proběhly."
tags:
  - aplikace
  - administrace
---

# Administrace

Pracovní nástroj personálu na `/admin`: přihlášení jedním sdíleným heslem, seznam nadcházejících rezervací a jejich mazání. Administrace má vlastní layout a styly nezávislé na veřejném webu, protože má mít jiný vzhled (PDF s. 6, kap. 5; s. 11 „Zásadní technická rozhodnutí“).

## Pravidla a záměr

### Přihlášení a session

- Přístup chrání jedno heslo z konfigurace, společné pro celý personál. Uživatelské účty ani role nejsou. Heslo v plain textu je pro demo vědomé zjednodušení, viz [bezpecnost.md](bezpecnost.md) (PDF s. 2, s. 6 „Přihlášení a session“; `src/config.js:24–25`).
- Heslo se porovnává v konstantním čase. Oba vstupy se nejprve zahashují SHA-256, protože `timingSafeEqual` vyžaduje stejnou délku vstupů. Špatné heslo vrátí stavový kód 401 a hlášku „Nesprávné heslo.“ (`verifyPassword`, `src/lib/session.js:15–18`; `src/routes/admin.js:79–89`).
- Po přihlášení vznikne náhodný 32bajtový token, který server drží jen v paměti procesu. Prohlížeč dostane cookie `admin_session` s příznaky `HttpOnly`, `SameSite=Strict` a `Path=/admin` (PDF s. 6; `createSession`, `src/lib/session.js:28–35`; `src/routes/admin.js:15, 87`).
- **Platnost 120 minut běží od přihlášení a aktivitou se neprodlužuje.** Personál se tak po dvou hodinách odhlásí i uprostřed práce (`src/lib/session.js:33, 37–53`). PDF uvádí jen délku platnosti.
- Odhlášení token zruší a restart serveru odhlásí všechny. Session patří jednomu procesu, více instancí serveru by je nesdílelo (PDF s. 7; `src/lib/session.js:8–9`).

### Kontrola přihlášení

Přihlášení ověřují jednotlivé handlery, nemá ho na starosti společná vrstva. `GET /admin` podle stavu session ukáže buď seznam, nebo přihlašovací formulář. Mazání bez platné session nic nesmaže a přesměruje na `/admin` (PDF s. 7 „Smazání rezervace“; `isAuthenticated`, `src/routes/admin.js:21–23, 71–77, 97–101`). **Nová chráněná routa musí kontrolu volat sama.**

### Seznam rezervací

- Seznam ukazuje rezervace od dnešního dne včetně, seřazené podle data, hodiny a pořadí vložení (PDF s. 7 „Seznam rezervací“; `src/db/reservations-repository.js:19–21`; `listUpcoming`, `src/services/reservation-service.js:166–172`).
- Filtruje se jen podle data, dnešní rezervace, které už proběhly, proto v seznamu zůstávají. Každá rezervace má stav, který počítá `listUpcoming`: `today` (dnešní), `past` (dnešní, jejíž hodinový slot už skončil, tedy `hodina < aktuální hodina`) a `upcoming` (další dny). Rezervace v probíhající hodině je stále `today`.
- Dnešní řádky mají tónované pozadí, akcentní proužek a štítek „Dnes“. Proběhlé dnešní řádky jsou ztlumené (průhlednost, přeškrtnutý čas) a štítek mají také. Rozlišení řeší třídy `admin-table__row--today` a `admin-table__row--past` v `admin.css`; štítek v ostatních řádcích je prázdný a skrývá ho `:empty` (TASK-016).

### Mazání

Každý řádek má vlastní formulář a prohlížeč se před odesláním zeptá na potvrzení. Po smazání server přesměruje kódem 303 na `/admin?deleted=1` s hláškou, podle vzoru Post/Redirect/Get (PDF s. 7; `src/routes/admin.js:97–105`; `src/assets/js/admin.js:3–8`; `redirect`, `src/lib/http.js:68–72`). Neexistující nebo neplatné ID skončí tichým přesměrováním na `/admin` bez hlášky.

## Netriviální postupy

- **Prázdné hlášky a prázdnou tabulku skrývá CSS.** Šablony nemají podmínky, proto handler předá prázdný řetězec a CSS prázdný prvek skryje. Obecný vzor popisuje [architektura.md](architektura.md). Pro administraci platí navíc toto: prázdnou tabulku skrývá pravidlo `:has(.admin-table__body:empty)`. Uvnitř `<tbody>` proto nesmí být žádné bílé znaky a handler spojuje řádky bez oddělovače (`src/views/pages/admin/reservations.html:15, 28`; `src/routes/admin.js:61–64`; `src/assets/css/admin.css:214–216, 240`).

## Rozhodnutí a omezení

- **Rezervaci nejde přidat ani upravit.** Telefonické rezervace personál zapisuje na papír u kasy a web o nich neví. Online kapacita slotů je proto nezapočítává (PDF s. 7 „Co administrace neumí“).
- **Minulé dny se nezobrazují** a chybí vyhledávání, filtr, stránkování i export (PDF s. 7, s. 11). Minulé rezervace proto nejde v rozhraní ani smazat a v databázi zůstávají natrvalo. PDF uvádí jako vědomé omezení, že se osobní údaje uchovávají bez časového omezení (PDF s. 11, řádek Data). Hromadně je dnes odstraní jen seed, který maže všechno, viz [rezervace.md](rezervace.md).

## Rozpory a otevřené otázky

- **Kde je tlačítko Odhlásit.** Podle PDF má hlavička administrace logo, nadpis Rezervace a tlačítko Odhlásit (PDF s. 7 „Vzhled“). V kódu má hlavička layoutu odkaz „Zobrazit web“ a tlačítko Odhlásit je jen v liště stránky se seznamem (`src/views/layouts/admin.html:12–21`; `src/views/pages/admin/reservations.html:7–9`). Jde jen o nepřesnost popisu.
- **Doba uchování osobních údajů** v části I stanovená není, PDF ji zmiňuje jen jako vědomé omezení. Otevřená otázka: má platit pravidlo pro odstraňování starých rezervací?

## Zdroje

- [docs/kavarna-holubnik.pdf](../kavarna-holubnik.pdf): s. 2 „Uživatelé a role“; s. 6–7, kap. 5 Administrace („Přihlášení a session“, „Seznam rezervací“, „Smazání rezervace“, „Co administrace neumí“, „Vzhled“); s. 11 „Zásadní technická rozhodnutí“ a „Funkční omezení aktuální verze“.
- Kód: [src/routes/admin.js](../../src/routes/admin.js), [src/lib/session.js](../../src/lib/session.js), [src/lib/http.js](../../src/lib/http.js), [src/services/reservation-service.js](../../src/services/reservation-service.js), [src/db/reservations-repository.js](../../src/db/reservations-repository.js), [src/views/layouts/admin.html](../../src/views/layouts/admin.html), [src/views/pages/admin/reservations.html](../../src/views/pages/admin/reservations.html), [src/assets/css/admin.css](../../src/assets/css/admin.css), [src/assets/js/admin.js](../../src/assets/js/admin.js), [src/config.js](../../src/config.js).
