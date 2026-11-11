# Plán: CSV export rezervací pro účetní (06-email-lucie-export)

Review: **11. 11. 2026**. Stav: aktualizovaný implementační plán; funkce zatím není implementovaná.

## Zadání a porovnání rozsahu

[Původní e-mail z 24. 10. 2026](06-email-lucie-export.md) požaduje přehled rezervací za celý předchozí měsíc, ideálně v Excelu, se sloupci datum, čas a jméno. Účetní si jej má stáhnout sama, bez ručního přepisování a pomoci správce webu.

CSV je již odsouhlasená náhrada souboru Excelu, nikoli výstup `.xlsx`. Samostatné stažení zajistí existující administrace. Záměrně omezený rozsah proti obecnému požadavku na přehled za celý měsíc je uveden níže.

## Potvrzená rozhodnutí

Při review uživatel znovu potvrdil přístup, první měsíc a rozsah evidence:

| Oblast | Rozhodnutí a dopad |
|---|---|
| Přístup | **Sdílené heslo personálu.** Účetní tím získá i přístup k telefonům hostů a možnost mazat nadcházející rezervace. Tato oprávnění jsou výslovně přijatá; nejde o přístup pouze k exportu. |
| První měsíc | **Listopad 2026**, první stažení od **1. 12. 2026** v pásmu Europe/Prague. Říjen a starší měsíce jsou mimo rozsah, přestože e-mail přišel v říjnu. |
| Úplnost | Stačí **dosud uložené online rezervace**. Telefonické rezervace mimo systém a fyzicky smazané záznamy ve výstupu nebudou; zpětně je nelze rekonstruovat. |

Ostatní již potvrzená rozhodnutí zůstávají:

- Formát: CSV, UTF-8 s jedním BOM, oddělovač `;`, datum `YYYY-MM-DD`, čas `HH:00`, konce řádků CRLF.
- Přesně tři sloupce v pořadí `Datum;Čas;Jméno`. Bez telefonu, ID a času vytvoření; schéma databáze se nemění.
- Vždy pevně **předchozí kalendářní měsíc**, bez volby období. Nejde o posledních 30 dní.
- Období určuje **datum rezervace**, nikoli `created_at`. Jedna uložená rezervace znamená jeden řádek; žádné slučování ani odstraňování shodných řádků.
- Prázdný dostupný měsíc vytvoří soubor pouze s BOM a hlavičkou, nikoli chybu.
- Bez nových npm závislostí, účtů, rolí, archivace nebo změn stávajícího mazání.

## Nálezy review a jejich řešení v plánu

| Nález | Podklad v aktuálním kódu | Doplnění nebo přijaté omezení |
|---|---|---|
| Samotná konfigurace nestačí | [server.js](../src/server.js) předává službě jednotlivé závislosti; [služba](../src/services/reservation-service.js) novou metodu ani parametr nemá. | Doplnit konfiguraci, předání při startu, parametr továrny, návrat nové metody a všechna místa vytvoření služby v testech. |
| „Celý měsíc“ není úplná historie | [Repozitář](../src/db/reservations-repository.js) maže fyzicky; [schéma](../src/db/schema.sql) nemá stav rezervace ani návštěvy. | Výslovně přijato: export jen existujících online záznamů, ne doklad skutečné návštěvnosti nebo tržeb. |
| Vývojový seed je nevhodný k ověření | [seed.js](../src/db/seed.js) smaže vše a vloží pouze budoucí rezervace. | Použít izolovanou databázi s historickými fixtures, nikdy seed nad skutečnými daty. |
| Testy nepokrývají celý průchod | [Dosavadní testy služby](../tests/reservation-service.test.js) neověřují HTTP, CSV ani dostupnost exportu. | Přidat testy CSV, kalendáře, dotazu a služby i chráněné routy a vykreslení obou stavů tlačítka. |
| Kontrakty a ochrany jsou neurčité | [HTTP helpery](../src/lib/http.js) nemají CSV odpověď; [datumové helpery](../src/lib/dates.js) nemají měsíční rozsah. | Definovat přesné návratové hodnoty, výstupní bajty, zákaz cache, ochranu CSV a chybové chování. |
| Neaktivní odkaz není zakázané tlačítko | [Šablony](../src/lib/template.js) nemají podmínky; atribut `disabled` na odkazu nefunguje. | Použít GET formulář s nativním tlačítkem a bezpečně podmíněným atributem `disabled`. |

## Návrh implementace

### 1. Konfigurace a propojení služby

- V [src/config.js](../src/config.js) přidat `reservations.exportFirstMonth: '2026-11'`.
- Rozšířit parametry `createReservationService` o `exportFirstMonth`; neimportovat konfiguraci přímo do služby.
- V [src/server.js](../src/server.js) předat `config.reservations.exportFirstMonth`.
- Upravit vytvoření služby v [tests/reservation-service.test.js](../tests/reservation-service.test.js) a nových testech. Novou metodu zahrnout do vraceného veřejného rozhraní služby.

### 2. Rozsah měsíce

- V [src/lib/dates.js](../src/lib/dates.js) přidat `previousMonthRange(now)`.
- Kontrakt: `{ from, to, month }`, všechny hodnoty jsou řetězce. Například pro prosinec 2026: `{ from: '2026-11-01', to: '2026-12-01', month: '2026-11' }`.
- `from` je první den minulého měsíce včetně; `to` první den aktuálního měsíce vyjma.
- Počítat z místního roku a měsíce pomocí kalendářních konstruktorů `Date` a `toIsoDate`, ne odečtením pevného počtu dní ani převodem přes `toISOString`.
- Respektovat existující `process.env.TZ = config.timezone` při startu serveru. Nic časově závislého nepočítat při importu modulu.

### 3. Výběr rezervací

- V [src/db/reservations-repository.js](../src/db/reservations-repository.js) přidat prepared statement a `listBetween(fromDate, toDate)`.
- Dotaz: `WHERE date >= ? AND date < ? ORDER BY date, hour, id`, parametrizovaně; SQL zůstává v repozitáři.
- Nepoužívat `listUpcoming`, které záměrně ukazuje jen dnešek a budoucnost. Export nesmí filtrovat podle současné otevírací doby ani podle času vytvoření záznamu.
- Repozitář může zachovat stávající mapování rezervace; projekci na tři exportní hodnoty provede služba.

### 4. Exportní metoda služby

- V [src/services/reservation-service.js](../src/services/reservation-service.js) přidat `getMonthlyExport(now)`.
- Návratový kontrakt: `{ available, month, availableFrom, rows }`.
  - `available`: předchozí měsíc je alespoň `exportFirstMonth`; porovnávat normalizované `YYYY-MM`.
  - `month`: řetězec `YYYY-MM` z měsíčního rozsahu.
  - `availableFrom`: ISO datum prvního dne následujícího po `exportFirstMonth`, tedy nyní `'2026-12-01'`. Odvodit z konfigurace, aby se UI a server nerozešly.
  - `rows`: pole objektů přesně `{ date, time, name }`; `time` přes existující `formatTime`. Explicitně vybrat vlastnosti, nekopírovat celou rezervaci pomocí spreadu.
- Při `available: false` vrátit `rows: []` bez dotazu do databáze. Dostupný měsíc bez rezervací má stále `available: true`.
- Databázové a jiné neočekávané chyby propagovat; nepřevádět je na prázdný úspěšný export.

### 5. CSV serializace

- Přidat pomocník v novém souboru `src/lib/csv.js`, který přijímá exportní řádky a vrátí hotový text CSV.
- Právě jeden UTF-8 BOM na začátku; první řádek `Datum;Čas;Jméno`. Každý řádek včetně posledního ukončit `\r\n`. Nepřidávat pomocný řádek `sep=;`.
- Hodnoty obsahující `;`, `"`, CR nebo LF uzavřít do dvojitých uvozovek; vnitřní `"` zdvojit. Zachovat diakritiku a obsah jména, nepoužívat HTML escapování.
- Nejdřív zabezpečit jméno proti interpretaci jako vzorce, pak jej CSV escapovat: prefix `'` pro `=`, `+`, `-`, `@` na začátku i po úvodních mezerách či tabulátorech/CR/LF; chránit také samotné úvodní tabulátory/CR/LF.
- Tato ochrana mění pouze exportovanou hodnotu rizikového jména, ne záznam v databázi. Přesná očekávání ukotvit testy a ověřit v cílovém Excelu.

### 6. Chráněná HTTP routa

- Do pole rout v [src/routes/admin.js](../src/routes/admin.js) zaregistrovat `GET /admin/export`.
- **Nejprve** ověřit `isAuthenticated`. Chybějící, neplatná nebo expirovaná session znamená přesměrování 303 na `/admin`; služba exportu se nesmí zavolat.
- Přihlášenému uživateli předat aktuální `new Date()` do služby. Pro časová rozhodnutí v jednom požadavku použít jediný zachycený okamžik.
- Nedostupný měsíc: přesměrování 303 na `/admin?export=unavailable`, kde se zobrazí vysvětlení dostupnosti, nikoli tiché přesměrování.
- Dostupný měsíc: sestavit celé CSV před odesláním hlaviček. Pomocník `sendCsv` v [src/lib/http.js](../src/lib/http.js) odešle:
  - status 200;
  - `Content-Type: text/csv; charset=utf-8`;
  - `Content-Disposition: attachment; filename="rezervace-YYYY-MM.csv"` podle exportovaného měsíce;
  - `Content-Length` podle `Buffer.byteLength` skutečného těla včetně BOM a diakritiky.
- Pro odpovědi této routy nastavit `Cache-Control: no-store`, včetně přesměrování.
- Nezavádět volitelný měsíc v query parametru ani názvu souboru od uživatele. Měsíc a dostupnost vždy určuje server.
- Neočekávané chyby ponechat standardní obsluze v [src/app.js](../src/app.js): logování a odpověď 500, nikoli soubor s hlavičkou nebo úspěšný prázdný výstup.

### 7. Ovládání v administraci

- Upravit [src/views/pages/admin/reservations.html](../src/views/pages/admin/reservations.html) a [src/assets/css/admin.css](../src/assets/css/admin.css), zachovat odhlášení i stávající seznam.
- V toolbaru použít formulář `method="get" action="/admin/export"` a nativní tlačítko `type="submit"` s třídou `admin-button--primary`.
- Dostupný stav: „Export za YYYY-MM“. Nedostupný stav: neaktivní „Export rezervací“ a viditelné vysvětlení „Dostupné od 1. 12. 2026“, odvozené z `availableFrom`.
- Handler předá pro raw atribut výhradně pevnou hodnotu `disabled` nebo prázdný řetězec; ostatní texty se dosazují běžným HTML escapováním. Nepoužít `disabled="false"`, který tlačítko také zakazuje, ani neúčinné `disabled` na odkazu.
- Prázdné vysvětlení lze skrýt přes `:empty` podle stávajícího vzoru. Hlášku po přímém pokusu o nedostupný export zobrazit srozumitelně.
- Tlačítko zůstává dostupné i při prázdném seznamu nadcházejících rezervací. Ošetřit vzhled `:disabled`, hover a zalamování toolbaru na mobilu; funkce nesmí vyžadovat JavaScript.
- Dodržet [instrukce pro CSS](../.github/instructions/css.instructions.md) a [HTML](../.github/instructions/html.instructions.md). Zachovat bílé znaky a strukturu stávajícího `<tbody>` tak, aby dál fungovalo skrývání prázdné tabulky.

### 8. Automatické testy a akceptace

Použít stávající `node:test` a `assert`, bez nových závislostí. Pro data používat `openDatabase(':memory:')` a historické fixtures vkládané repozitářem; veřejná služba zpětné rezervace záměrně nepřijímá. Databáze a případné testovací HTTP servery po testech zavřít.

| Oblast | Povinné ověření |
|---|---|
| Kalendář | Přesný kontrakt rozsahu, běžný měsíc, leden → prosinec předchozího roku, únor v běžném i přestupném roce a měsíce s přechodem letního času. |
| Dostupnost | V listopadu 2026 export nedostupný; od 1. 12. 2026 dostupný listopad; v lednu 2027 dostupný prosinec. Ověřit i odvození `availableFrom` z jiné testovací konfigurace. |
| Pražská půlnoc | V izolovaném testovacím procesu s `TZ=Europe/Prague`: `2026-11-30T22:59:59Z` ještě nedostupné, `2026-11-30T23:00:00Z` již dostupný listopad. Nespoléhat na zónu stroje ani neměnit systémové hodiny. |
| Repozitář a služba | Zahrnout první a poslední den období; vyloučit den před `from` a den `to`; řadit podle data, hodiny a ID. Zachovat samostatné shodné rezervace, neomezovat historické hodiny současnou otevírací dobou a nefiltrovat podle `created_at`. |
| Minimalizace dat | Výstupní objekty mají přesně `date`, `time`, `name`; CSV má přesně tři sloupce a neobsahuje telefon, ID ani čas vytvoření. Nedostupný měsíc nesahá do repozitáře. |
| CSV | Jediný BOM (`EF BB BF`), přesná hlavička a pořadí, diakritika, CRLF včetně posledního řádku, prázdný měsíc, středníky, uvozovky, CR/LF ve jménu a všechny uvedené rizikové prefixy včetně bílých znaků. |
| HTTP | Bez session, neplatná i expirovaná session: 303 bez volání exportu; přihlášený: 200, správný název, typ, zákaz cache a bajtová délka; nedostupný měsíc: 303 s vysvětlením; prázdný měsíc: platné CSV s hlavičkou. |
| Chyby a UI | Selhání repozitáře/serializace nevrátí CSV se statusem 200. Vykreslení aktivního i skutečně neaktivního tlačítka, hlášky dostupnosti a zachování seznamu, mazání a odhlášení. |

Rozdělit mezi nový `tests/csv.test.js`, případný `tests/dates.test.js`, rozšíření testů služby a nový `tests/admin-export.test.js`. HTTP testy mají deterministický exportní stub služby; reálný výběr období ověřují testy skutečné služby nad SQLite. Pro stav session použít existující session helpery a kontrolovaný čas.

### 9. Dokumentace

Po skutečné implementaci, nikoli už při tomto review:

- [docs/administrace.md](../docs/administrace.md): postup stažení, dostupnost, společné heslo a jeho oprávnění, přesný rozsah exportu; opravit tvrzení, že export chybí.
- [docs/rezervace.md](../docs/rezervace.md): export neobnovuje smazaná data ani nedokládá návštěvy; zachovat varování před destruktivním seedem.
- [docs/architektura.md](../docs/architektura.md): doplnit měsíční metodu a skutečné nové pokrytí testy místo tvrzení, že HTTP a administrace nejsou testované.
- [docs/prehled-aplikace.md](../docs/prehled-aplikace.md) a [README.md](../README.md): doplnit export do popisu administrace, nezaměňovat jej za obecné prohlížení historie.
- U měněných dokumentů s front-matter aktualizovat `updated` a `lastChange`.
- `DECISIONS.md` při review v kořeni chybí. Tento plán nemění technologii, strukturu ani model přístupu. Pokud při implementaci vznikne zásadní změna těchto rozhodnutí, nejprve ji odsouhlasit a zaznamenat do `DECISIONS.md` s datem a důvodem; běžné lokální detaily tam nepatří.

### 10. Bezpečné ruční ověření

- Spouštět cílené testy během implementace a nakonec `npm test`, včetně dosavadních testů.
- Použít **oddělenou testovací databázi**, nikoli stávající soubor s rezervacemi. Nevytvářet testovací historii spuštěním `npm run db:seed`.
- V testovacím prostředí ověřit přihlášení, stažení bez session i s ní, prázdný měsíc a obě podoby ovládání. Před 1. 12. 2026 ověřit úspěšné stažení pomocí izolovaného testovacího HTTP serveru s deterministickou službou; neobcházet omezení v produkční konfiguraci ani neměnit systémové hodiny.
- Otevřít reprezentativní CSV v cílovém Excelu: tři sloupce, české znaky, datum a čas, jména se středníkem/uvozovkou/novým řádkem a rizikové hodnoty jako text, nikoli vzorce. BOM zkontrolovat také na úrovni bajtů; samotné `file` nebo `xxd` kompatibilitu s Excelem nedokazuje.
- Po ověření ukončit testovací server a odstranit jen konkrétní dočasná testovací data.

## Todos

- [ ] config-export-month-and-wiring
- [ ] dates-previous-month
- [ ] repo-list-between
- [ ] service-monthly-export
- [ ] csv-helper
- [ ] admin-export-route-and-http
- [ ] admin-export-ui
- [ ] unit-and-http-tests
- [ ] docs-update
- [ ] isolated-verification

## Poznámky / rizika

- Export obsahuje osobní údaje a stažený soubor zůstává mimo ochranu přihlášení aplikace. Do CSV nepatří telefon, ale sdílený přístup jej v administraci dál zpřístupňuje.
- Účetní si musí soubor uložit včas: během ledna stáhne prosinec, ale listopad už bez volby období znovu nestáhne. Archiv souborů ani výběr starších měsíců nejsou součástí tohoto plánu.
- Výstup je snímek aktuálně uložených rezervací, nikoli neměnný účetní archiv. Neobsahuje všechny provozní rezervace, návštěvnost, útratu ani tržby.
- Časové pásmo a logika předchozího měsíce musí zůstat shodné mezi službou, UI a HTTP; klientský čas ani stav tlačítka nenahrazují kontrolu na serveru.
