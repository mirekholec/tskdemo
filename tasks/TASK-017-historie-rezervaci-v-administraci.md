---
id: TASK-017
todoist-id: 6hwVHcJ27Cch6HhW
name: Historie rezervací v administraci
status: new
---

V administraci přidat stránku s historií rezervací, kde lze minulé rezervace vyhledat podle jména nebo telefonu, omezit je datem nebo obdobím od–do a procházet je po stránkách.

## Požadavky

- Zdroj požadavku: Todoist task „hlasovka-jana-historie-rezervaci (14)“ (Jana, provozní). K tasku nejsou žádné komentáře. Motivace: host volá kvůli zapomenuté věci a Jana nevidí, kdy u nich byl, protože `/admin` ukazuje jen rezervace od dneška dál.
- Nová stránka **Historie** pod stejným přihlášením jako seznam rezervací, dostupná odkazem ze seznamu (a zpět).
- Hledání podle **jména** (část jména, bez ohledu na velikost písmen a diakritiku, např. „kovar“ najde „Kovářová“) a podle **telefonu** (část čísla, bez ohledu na mezery, `+` a předvolbu 420).
- Jedno vyhledávací pole pro jméno i telefon. Telefonní dotaz se pozná podle toho, že obsahuje jen číslice, mezery a `+`.
- Filtr data: pole **Od** a **Do**. Jediný den = stejné datum v obou polích. Vyplněné jen jedno pole znamená otevřenou hranici na druhé straně. Rychlé volby pro „Minulý týden“ a „Minulý měsíc“ jsou vítané, ale nepovinné („třeba celý minulý týden“).
- Výsledky jsou **stránkované** (např. 25 na stránku), řazené od nejnovějších. Ukazují datum, čas, jméno, telefon a datum vytvoření a celkový počet nalezených rezervací.
- Historie sahá **nejvýše 12 měsíců zpět** (zásada Z6 z vize kavárny a řádek 14 roadmapy). Starší data se nezobrazí ani při ručním zadání data.
- Historie obsahuje rezervace s datem **před dneškem**. Dnešní a budoucí rezervace zůstávají v současném seznamu beze změny (včetně zvýraznění z TASK-016 a mazání).
- Stránka je jen k nahlížení, mazání v historii není. Důvod: osobní údaje se mají naopak omezovat, ne se spravovat ručně. Případné mazání je mimo rozsah.
- Použitelné prstem na tabletu (zásada Z5): dostatečně velká pole a tlačítka, filtr funguje bez JavaScriptu (běžný `GET` formulář), stav hledání je v URL a dá se obnovit nebo sdílet.

## Technické poznámky

- Vstupní bod: `GET /admin/historie?q=&od=&do=&strana=`. Handler musí **sám** volat `isAuthenticated`, společná vrstva neexistuje (viz `docs/administrace.md`). Nepřihlášený uživatel dostane přihlašovací formulář nebo přesměrování na `/admin`.
- Repository (`src/db/reservations-repository.js`) je jediné místo s SQL. Přidat parametrizovaný dotaz `listBetween(fromDate, toDate)` s `ORDER BY date DESC, hour DESC, id DESC`. Hranice jsou řetězce `YYYY-MM-DD`, takže stačí porovnání textu, existující index `(date, hour)` pomůže.
- Filtrování jména a telefonu a stránkování provádět ve **službě** v JS nad výsledkem omezeným datem (nejvýše rok dat, malý objem). Důvod: SQLite `LIKE` nerozlišuje velikost písmen u české diakritiky. Normalizace jména: `toLowerCase()` + `normalize('NFD')` a odstranění kombinujících znaků. Žádný nový závislostní balíček.
- Normalizace telefonu pro hledání: ponechat jen číslice; pokud začíná `00420` nebo `420` a má víc než 9 číslic, odstranit předvolbu. Hledá se jako podřetězec čísel uložených bez `+` a mezer. Uložené telefony se nemění ani nemigrují (plná normalizace při ukládání patří do požadavků 05 a 10, viz závislosti v roadmapě). Tento úkol na nich nezávisí.
- Čas bere služba z parametru `now` (testovatelnost, stejně jako `listUpcoming`). Spodní hranice = dnes − 12 měsíců (`setMonth(-12)`, ošetřit konec měsíce), horní hranice = včera.
- Neplatný vstup nesmí vést k chybě 500: neplatné nebo prázdné datum se ignoruje, `od` > `do` zobrazí hlášku „Datum Od je později než Do.“ a prázdný výsledek, neplatné číslo stránky spadne na 1 a číslo nad poslední stránku na poslední. Dotaz `q` oříznout na rozumnou délku (např. 80 znaků).
- Šablony nemají podmínky. Handler předává hotové hodnoty, prázdné hlášky skrývá CSS (`:empty`), stejný vzor jako v `reservations.html`. Řádky tabulky přes nový partial `partials/history-row.html`, stránkování sestavit v handleru jako fragment (odkazy „Předchozí“ / „Další“ se zachovanými parametry `q`, `od`, `do`). Hodnoty parametrů v odkazech kódovat `URLSearchParams`, texty v HTML escapuje šablonovací systém (`{{ }}`), `{{{ }}}` jen pro hotové fragmenty.
- Vzhled v `admin.css` podle existujících tříd `admin-*`. Žádný inline styl, žádný nový JS.
- Telefony se v historii zobrazují jako odkaz `tel:` stejně jako v seznamu. Stránka s osobními údaji nesmí být cachovaná sdíleně, zvážit `Cache-Control: no-store` u odpovědi (v `sendHtml` dnes není).
- `DECISIONS.md` v repozitáři neexistuje. Rozhodnutí „historie = data před dneškem, 12 měsíců, bez mazání“ zapsat do dokumentace (`docs/administrace.md`).
- Mimo rozsah: anonymizace rezervací starších 12 měsíců (samostatná práce navazující na Z6), export pro účetní, e-mail, počet osob a stav rezervace (požadavky 12, 04), úprava a přidání rezervace.

## Implementační plán

Při návrhu implementačního plánu je nutné, aby následující kroky na sebe navazovaly v tomto pořadí. Je přitom možné mezi tyto kroky přidat kroky jiné.

1. Repository: přidat `listBetween(fromDate, toDate)` (parametrizovaný dotaz, řazení od nejnovějších, obě hranice volitelné).
2. Služba: přidat funkce pro normalizaci jména a telefonu (čisté funkce, exportované kvůli testům) a `searchHistory({ query, from, to, page }, now)`. Služba omezí rozsah na 12 měsíců zpět až včera, zvaliduje datumy přes `parseIsoDate`, vyfiltruje podle jména nebo telefonu, stránkuje (velikost stránky konstanta, např. 25) a vrátí `{ items, total, page, pageCount, from, to, error }` s položkami doplněnými o `time`.
3. Testy `tests/reservation-service.test.js` (nebo nový `tests/history.test.js`) s pevným `now`: hledání podle jména bez diakritiky a velikosti písmen, hledání telefonu s mezerami, `+420` a bez předvolby, filtr jednoho dne a od–do, otevřené hranice, vyloučení dneška a budoucnosti, limit 12 měsíců, `od` > `do`, neplatná data, stránkování (první, poslední, mimo rozsah), řazení od nejnovějších.
4. Šablony: stránka `views/pages/admin/history.html` (formulář `GET` s poli hledání, Od, Do a tlačítky Hledat a Zrušit filtr, volitelně rychlé volby minulý týden a měsíc, počet nalezených, tabulka, stránkování) a partial `partials/history-row.html`.
5. Route: v `src/routes/admin.js` přidat `GET /admin/historie` s vlastní kontrolou přihlášení, čtením `req.query`, voláním služby, sestavením řádků a stránkování a odpovědí přes `render` s layoutem administrace. Přidat odkaz „Historie“ do `reservations.html` a odkaz zpět „Nadcházející rezervace“ do historie.
6. Styly v `src/assets/css/admin.css`: filtrační formulář (velké ovládací prvky pro dotyk), stránkování, skrytí prázdné hlášky a prázdné tabulky stejným postupem jako v seznamu.
7. Ruční ověření v prohlížeči: `npm run db:seed` (seed maže všechny rezervace, jen v lokální DB), případně doplnit pár minulých záznamů přímo do lokální DB, a projít hledání, filtry, stránkování, tablet viewport a přístup bez přihlášení.
8. Dokumentace: `docs/administrace.md` (nová sekce Historie, úprava odstavce „Minulé dny se nezobrazují“, front-matter `updated` a `lastChange`, nová routa a pravidla 12 měsíců a bez mazání), případně zmínka v `docs/rezervace.md` o vyhledávání podle telefonu bez normalizace při ukládání a `docs/prehled-aplikace.md`, pokud uvádí seznam stránek.
9. Spustit `npm test`, po dokončení nastavit status tasku na `completed` a přesunout soubor do `tasks/completed`.

## Akceptační kritéria

- Přihlášený uživatel otevře ze seznamu rezervací stránku Historie. Nepřihlášený ji neuvidí.
- Hledání „kovar“ najde rezervaci jména „Kovářová“ a hledání „777 111 222“, „+420777111222“ i „777111222“ najde stejnou rezervaci.
- Výběr jednoho dne nebo období Od–Do (např. celý minulý týden) vrátí jen rezervace z tohoto období, kombinovatelné s hledáním.
- Výsledky jsou od nejnovějších, stránkované a odkazy mezi stránkami zachovávají hledání i filtr.
- Zobrazují se jen rezervace před dneškem a nejvýše 12 měsíců staré. Dnešní a budoucí rezervace zůstávají v původním seznamu beze změny.
- Neplatné nebo protichůdné vstupy (špatné datum, Od později než Do, stránka mimo rozsah) nezpůsobí chybu serveru a zobrazí srozumitelnou hlášku nebo prázdný výsledek.
- Prázdný výsledek zobrazí zprávu „Nic nenalezeno.“ a skryje tabulku.
- Stránka je použitelná na tabletu a funguje bez JavaScriptu.
- Dokumentace v `docs/` je aktualizovaná a `npm test` projde.
