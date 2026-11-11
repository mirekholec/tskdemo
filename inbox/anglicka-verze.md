# 09 — Anglická verze veřejného webu: finální zadání a implementační plán

Datum: 6. 11. 2026  
Stav: zadání upřesněné s uživatelem a porovnané se současným kódem; implementace neprovedena.

Výchozí podklad: [původní zadání](../inbox/requirements/09-porada-anglicka-verze-zadani.md). Tento dokument doplňuje technický postup, rozhodnutí uživatele a ověřitelná akceptační kritéria.

## 1. Cíl a potvrzený rozsah

Zpřístupnit turistům celý veřejný web v angličtině včetně dokončení rezervace. Zachovat českou verzi, ceny v českých korunách, současný vzhled a provozní pravidla. Připravit řešení na pozdější přidání němčiny, ale německou verzi nyní nevytvářet.

### Rozhodnutí potvrzená uživatelem

| Oblast | Závazné zadání |
|---|---|
| Rozsah překladu | Celý veřejný web: úvod, rezervace, potvrzení, všechny hlášky, 404/500, metadata a přístupnostní texty. |
| Struktura webu | Zachovat one-page prezentaci a samostatnou stránku rezervace. Anglické kotvy také přeložit. |
| Adresy | `/cz/`, `/en/`, `/cz/rezervace`, `/en/reservation`. |
| Výchozí jazyk | Bez uložené volby čeština. Na `/` použít uloženou volbu, pokud existuje; automatický přechod provede JavaScript. |
| Přednost explicitní URL | `/cz/...` i `/en/...` vždy respektovat, bez přesměrování podle uloženého jazyka či jazyka prohlížeče. |
| Staré rezervace | `/rezervace` trvale přesměrovat na `/cz/rezervace`, nezávisle na uloženém jazyce. |
| Zdroj překladů | Při implementaci připravit překlady současných textů; externí schválené překlady nebudou dodány. |
| Angličtina | Britská angličtina, locale `en-GB`, například `Fri 6 Nov`, čas `13:00`, cena `59 CZK`. |
| Rozpracovaná rezervace | Při přepnutí jazyka formulář resetovat. Před ztrátou vyplněných údajů upozornit a umožnit přechod zrušit. |
| Rozpory v obsahu | Výslovný pokyn uživatele: „Jen přelož a neřeš rozpory.“ Texty obsahově nesjednocovat. |
| Administrace | Zůstává česky, bez jazykových variant administrátorských URL a bez jazykového přepínače v administrátorském layoutu. |

Název Kavárna Holubník, oficiální adresa, kontakty a číselné ceny zůstávají zachované. Překládají se popisné texty, nikoli vlastní jména. Česká verze může nadále uvádět `Kč`, anglická používá `CZK`; nejde o převod měny.

### Mimo rozsah

- Nové samostatné stránky pro jednotlivé sekce, redesign a změny nabídky nebo ceníku.
- Německé překlady, aktivní `/de/` routy, CMS nebo externí překladová služba.
- Změny kapacity, délky rezervace, otevírací doby, rozsahu dní či validace telefonu a jména.
- Opravy stávajících obsahových rozporů, automatické rušení při zpoždění, e-maily a SMS.
- Lokalizace administrace a CSV exportu, změny databáze nebo ukládání jazyka k rezervaci.
- Zachování rozpracovaných osobních údajů při přepnutí jazyka.
- Analytika, nové cookies a zavádění consent banneru. Jazyková preference se ukládá pouze do localStorage.

## 2. Zjištění ze současné codebase

| Místo | Současný stav a dopad |
|---|---|
| [Veřejné routy](../src/routes/pages.js) | Jen `GET /` a `GET /rezervace`. Nadpisy a meta popisy jsou české přímo v handleru. |
| [Router](../src/lib/router.js) | Vlastní tabulka rout; podporuje parametry a toleruje koncová lomítka. Není potřeba zavádět framework ani nový router. |
| [Šablonovací engine](../src/lib/template.js) | Má konfigurovatelný `viewsDir`, rekurzivní includes, escapování a ochranu cest. Includes jsou relativní ke kořeni enginu, nikoli ke složce aktuálního souboru. |
| [Veřejný layout](../src/views/layouts/main.html) a [hlavička](../src/views/partials/header.html) | Pevné `lang="cs"`, české přístupnostní texty a odkazy bez jazykového prefixu. Přepínač zatím neexistuje. |
| [Konfigurace](../src/config.js) | Sdílené kontakty, otevírací doba a český `cafe.tagline`. Lokalizovat tagline, nikoli kopírovat veškerou konfiguraci. |
| [Nabídka](../src/views/sections/menu.html) | Statické názvy, popisy, ceny a popisky fotografie. Obě jazykové varianty musí zachovat stejné položky a částky. |
| [Rezervační služba](../src/services/reservation-service.js) | Vrací české názvy dní, `Dnes`, `dateLabel` i texty validačních chyb. Samotné kopie HTML tedy anglickou rezervaci nezajistí. |
| [Datumové pomocné funkce](../src/lib/dates.js) | Formátují pevně v `cs-CZ`. Sdílí je také administrace; její výchozí češtinu nelze plošně přepnout. |
| [JSON API](../src/routes/reservations-api.js) | Sdílené `/api/slots` a `/api/reservations`, české texty chyb a `dateLabel`. Zachovat adresy, stavové kódy a strukturu odpovědí. |
| [Rezervační JavaScript](../src/assets/js/reservation.js) | České texty validace, dostupnosti a jejího skloňování, načítání, výpadků, odesílání i oznámení pro čtečky. Zobrazuje také texty ze serveru. |
| [Navigační JavaScript](../src/assets/js/main.js) | Aktivní sekce hledá podle skutečných URL a hashů. Přeložené odkazy a ID musí zůstat vzájemně konzistentní. |
| [Obsluha chyb](../src/app.js) a [HTTP pomocné funkce](../src/lib/http.js) | HTML 404/500, nouzový prostý text a chyby při čtení JSON jsou české. Jazyk je nutné určit i mimo úspěšně nalezený handler. |
| [Administrace](../src/routes/admin.js) | Má vlastní český layout a používá stejnou službu i datumové funkce. CSV export a přihlašování se nesmějí změnit. |
| [Testy](../tests/) | Existují testy enginu, služby a HTTP exportu. Některé výslovně očekávají české názvy dní a český `dateLabel`; tyto výchozí kontrakty zachovat. |

Respektovat [popis architektury](../docs/architektura.md): čistý JavaScript, Node.js, vestavěné testy, serverové HTML, žádné npm závislosti ani build krok. Soubor `DECISIONS.md` v kořeni při přípravě plánu nebyl nalezen, přestože na něj odkazuje README. V tomto kroku jej nevytvářet; zaznamenání rozhodnutí je součástí budoucí implementace.

## 3. Požadované chování

### 3.1 Routy a kompatibilita

| URL | Výsledek |
|---|---|
| `/` | HTTP 200 s použitelným českým úvodem. JavaScript přečte uloženou volbu a přes `location.replace` přejde na `/cz/` nebo `/en/`. Bez JavaScriptu zůstane funkční česká prezentace. |
| `/cz/`, `/en/` | Úvod v jazyce URL, nezávisle na localStorage. |
| `/cz/rezervace`, `/en/reservation` | Rezervační formulář v jazyce URL, nad stejnými daty a stejnou kapacitou. |
| `/rezervace` | HTTP 301 na `/cz/rezervace`; zachovat query parametry. |
| `/cz`, `/en` | HTTP 301 na příslušnou variantu s koncovým lomítkem. Rezervační stránky mají kanonickou variantu bez koncového lomítka. |
| `/en/neznamy-slug` | Anglická HTML 404, nikoli tichý návrat na úvod. |
| `/cz/reservation`, `/en/rezervace` | 404 v jazyce prefixu; cizojazyčné slugs nejsou další aliasy. |
| `/de/`, neznámý prefix nebo neprefixovaná neznámá stránka | Česká 404. Němčina zatím není podporovaný jazyk. |
| `/admin...`, `/api/...`, `/assets/...` | Zachovat dosavadní adresy bez jazykového prefixu. |

Změny kanonizace omezit na veřejné routy; neměnit globální chování metod a lomítek pro API a administraci. Odkazy ve veřejných šablonách vedou přímo na jazykové URL, ne přes `/`.

### 3.2 Přeložené kotvy

| Význam | CZ | EN |
|---|---|---|
| Úvodní sekce | `#uvod` | `#home` |
| O nás | `#o-nas` | `#about-us` |
| Nabídka | `#nabidka` | `#menu` |
| Atmosféra | `#atmosfera` | `#atmosphere` |
| Rezervační pás | `#rezervace` | `#reservation` |
| Návštěva | `#navsteva` | `#visit` |
| Hlavní obsah / přeskočení navigace | `#obsah` | `#content` |

Navigace ze stránky rezervace musí mířit na jazykový úvod s příslušnou kotvou. Přepínač zachová význam stránky a při zapnutém JavaScriptu převede známou kotvu, například `/cz/#nabidka` → `/en/#menu`. Stejný převod využít pro staré odkazy `/#nabidka` při vstupu přes `/`; rozpoznat i již anglické kotvy. Nepřekládat identifikátory formulářových polí, technické `data-*` selektory ani názvy JSON polí.

### 3.3 Přepínač a localStorage

- V hlavičce veřejného webu zobrazit odkazy `CZ` a `EN`, přístupně označit jazyky a aktivní variantu. Přepínač musí být dostupný i na mobilu.
- Použít skutečné odkazy na odpovídající stránku: základní změna jazyka funguje také bez JavaScriptu. Převod aktuálního hashe vyžaduje JavaScript, protože server fragment URL nedostává.
- Uložit poslední ruční volbu pod jedním klíčem, například `holubnik.language`, s hodnotou `cz` nebo `en`. Přímé otevření explicitní URL uloženou ruční volbu nepřepisuje.
- Uloženou hodnotu automaticky využívat jen při vstupu na `/`. Nenahrazovat ji detekcí `navigator.language`, hlavičkou `Accept-Language` ani geolokací.
- Na `/` při chybějící, neznámé nebo nečitelné hodnotě použít CZ. Zachovat query a převést známý fragment podle cílového jazyka. Použít nahrazení historie, aby tlačítko Zpět necyklilo přes vstupní stránku.
- Nedostupné localStorage nesmí rozbít navigaci ani rezervaci. Ošetřit konkrétní chyby čtení/zápisu, zaznamenat varování a při neúspěšném zápisu srozumitelně oznámit, že volba nebude zapamatována. Přechod do zvoleného jazyka přesto funguje.
- Neukládat osobní údaje, obsah formuláře ani stav dokončené rezervace do localStorage nebo URL.
- Nezobrazovat přepínač pro neexistující německou verzi. Na chybové stránce bez známého protějšku nabídnout jazykový úvod, nevymýšlet překlad neznámého slugu.

### 3.4 Přepnutí při rezervaci

- Pokud host něco vyplnil nebo změnil automaticky vybraný den, před navigací zobrazit upozornění v aktuálním jazyce.
- Zrušení upozornění zachová URL, formulář i uloženou preferenci.
- Potvrzení otevře protějšek rezervační stránky s prázdným formulářem a novým načtením dostupnosti. Nepřenášet rezervaci ani znovu neposílat POST.
- Během probíhajícího odesílání přepnutí zablokovat a oznámit, že je nutné počkat na výsledek; předejít nejasnému výsledku již přijaté rezervace.
- Bez JavaScriptu zůstane platné současné upozornění, že online rezervace vyžaduje JavaScript, včetně kontaktu na kavárnu.

### 3.5 Obsah, formátování a chyby

- Přeložit všechny veřejné fragmenty, názvy a popisy nabídky, tagline, tlačítka, stavy formuláře, potvrzení, `noscript`, `alt`, `aria-label`, skryté texty a živá oznámení.
- Přeložit title, description i textové Open Graph údaje. Ve veřejném HTML nastavit správný jazyk: český kód URL je `cz`, ale standardní jazykový tag je `cs`; anglický tag je `en`, formátovací locale `en-GB`.
- U úvodu a rezervace doplnit canonical na vlastní jazykovou URL a vzájemné `hreflang` odkazy `cs`/`en`. Vstupní `/` kanonizovat na `/cz/`; nespoléhat na uloženou preferenci pro obsah explicitních URL.
- Anglické názvy dní a měsíců, `Today`, dostupnost stolů a potvrzení nesmějí obsahovat české věty. Výjimkou jsou zachovaná vlastní jména a oficiální adresa.
- Použít britské datum s krátkým názvem měsíce, například `Fri 6 Nov`, nikoli americké pořadí ani české `6. 11.`. Čas zůstává 24hodinový.
- Jazyk nemění pásmo `Europe/Prague`, „dnes“, nabídku dnů, ISO datum, číselnou hodinu ani uložená data. Všechny varianty pracují se stejnou rezervací.
- Lokalizovat HTML 404/500 podle známého veřejného prefixu, ostatní neprefixované HTML chyby ponechat česky. Zachovat stavové kódy, oddělení JSON/HTML a logování neočekávaných chyb.
- Lokalizovat také nouzovou prostou odpověď při selhání chybové šablony. Technickou výjimku logovat na serveru; návštěvníkovi zobrazit předem připravenou hlášku v jeho jazyce.
- Obsahově zachovat i dnešní rozpor mezi „stůl podržíme celou hodinu“ a „stůl držíme 15 minut“. Jeho oprava není podmínkou dokončení této funkce.

## 4. Technický návrh přizpůsobený aplikaci

### 4.1 Společný jazykový registr

Přidat malý společný modul, například `src/lib/i18n.js`, obsahující:

- Povolené kódy `cz` a `en`, standardní jazykové tagy a formátovací locales.
- Mapu logických stránek `home` / `reservation` na jejich cesty a mapu kotev.
- Překlady dynamických hlášek, metadat a tagline; žádné kopie kontaktních nebo rezervačních nastavení.
- Pomocné funkce pro bezpečný výběr jazyka, tvorbu veřejných URL a formátování prezentačních dat.

Jazyk vždy vybírat z whitelistu, nikdy neskládat souborovou cestu přímo z URL či hlavičky. Nevytvářet obecný překladový framework. Pozdější němčina má vyžadovat doplnění registru, katalogu a složky šablon, nikoli kopírování handlerů nebo pravidel rezervací.

### 4.2 Dvě složky veřejných šablon

Přesunout veřejnou českou sadu do `src/views/cz/` a vytvořit anglickou sadu `src/views/en/`. V každé sadě zachovat `layouts/main`, veřejné `pages`, `partials` a `sections`.

Využít existující `createTemplateEngine({ viewsDir, globals })` pro samostatný kořen každého jazyka. Tím fungují stávající includes typu `{{> sections/hero }}` bez změny jejich syntaxe. Pouhé přesunutí vstupní stránky pod `cz/` či `en/` při zachování jediného kořene by vnořené includes nevyřešilo.

- Veřejné renderování oddělit od dosavadních exportů používaných administrací; vybraná jazyková instance vykresluje také `day-option` a chybové stránky.
- Administrátorské šablony, layout a `admin-row` ponechat ve společném původním kořeni. Odkaz „Zobrazit web“ v administrátorském layoutu nasměrovat přímo na `/cz/`.
- Zachovat společné CSS, fotografie, fonty a JavaScript pod `/assets/`; tyto soubory nekopírovat pro každý jazyk.
- Zachovat escapování proměnných, kontrolu názvů, ochranu proti úniku z kořene, limit vnoření a chybu při chybějícím fragmentu.
- Chybějící anglickou šablonu netiše nenahrazovat českou. Úplnost obou sad ověřit testy; provozní chyba musí být viditelná v logu a vrátit standardní chybovou odpověď.

### 4.3 Prezentace nad nezměněnými pravidly rezervací

Lokalizaci dat provádět na hranici stránek a API. Zachovat stávající český výstup služby pro její dosavadní volající a testy:

- Stránkový handler vytvoří anglické popisky dnů z ISO data, nikoli překladem řetězců `Pá` nebo `Dnes`. Jeden aktuální čas použije pro načtení dnů i rozpoznání dneška.
- Datumovým helperům přidat podle potřeby volitelný locale / formát, s dosavadním českým chováním jako výchozím. Anglická varianta používá krátký název měsíce.
- Veřejné API sestaví lokalizovaný `dateLabel` z vráceného ISO data. Neměnit význam ani formát `date` a `time`.
- Pro validační chyby doplnit stabilní interní identifikátory jednotlivých důvodů a potřebné parametry, například délku jména. Zachovat existující české `fields` na chybě pro zpětnou kompatibilitu; API podle identifikátorů vytvoří texty požadovaného jazyka.
- Nepřekládat chyby porovnáváním českých vět. Rozlišit alespoň chybějící/neplatný den, chybějící/již začatou hodinu, délku jména, telefon a plný slot.
- Stejný princip použít pro očekávané chyby čtení těla v HTTP vrstvě. Samotné validační podmínky, transakce a práce s databází zůstávají stejné.

### 4.4 Sdílené API a browser JavaScript

Ponechat `/api/slots` a `/api/reservations`. Jazyk obou požadavků z prohlížeče předávat jednotně hlavičkou `X-Site-Language: cz` nebo `en`; bez hlavičky zachovat CZ. Nepodporovanou hodnotu odmítnout jako 400, bez provedení rezervace.

Jazyk API určit před čtením těla, aby také neplatný JSON, příliš velké tělo a nepodporovaný typ obsahu měly správně lokalizovanou odpověď. Hlavička nesmí ovlivnit administraci. Zachovat kontrakty:

- Úspěch 201: `id`, `date`, `time`, `dateLabel`.
- Validace 400: `error: "validation"` a `fields` se stejnými názvy polí.
- Plný slot 409: `error: "slot_full"` a lokalizované `message`.
- Ostatní existující kódy, například `bad_request`, `not_found`, `server_error`, zůstávají strojově stejné.
- Dosavadní `Cache-Control: no-store` JSON odpovědí zachovat.

Předat browseru pouze potřebné přeložené UI texty z téhož katalogu, například escapovanými `data-*` atributy rezervačního formuláře. Nezavádět druhý nezávislý slovník českých a anglických chyb přímo v JavaScriptu ani neposílat celou konfiguraci klientovi.

V rezervačním skriptu nahradit všechny české texty katalogem, doplnit anglický jednotný/množný tvar dostupnosti a používat lokalizovaná data z API. Zachovat práci s `textContent`, fokus, živé oblasti, rušení starého načítání slotů a obnovení dostupnosti při 409.

Přepínání, práci s preferencí a převod kotev lze oddělit do malého `src/assets/js/language.js` připojeného přes veřejný hlavní skript. Zabránit duplicitě map URL mezi serverem a browserem předáním potřebných hodnot v HTML.

## 5. Doporučené pořadí implementace

1. **Základ a rozhodnutí:** zavést jazykový registr a při skutečné implementaci založit `DECISIONS.md` s datem, rozhodnutím a důvodem pro jazykové složky, prefixy a klientské vyhodnocení preference na `/`.
2. **Šablony:** přesunout veřejnou českou sadu, přidat anglickou a jazykové renderování; zachovat původní engine pro administraci.
3. **Routy a metadata:** registrovat dvojice veřejných cest ze společné mapy, vstupní `/`, staré přesměrování, kanonizaci a lokalizované chyby. Přepsat všechny veřejné odkazy a kotvy.
4. **Dynamické texty a API:** rozšířit prezentační formátování a interní identifikátory chyb, přidat výběr jazyka API a zachovat české výchozí kontrakty.
5. **Prohlížeč:** lokalizovat rezervaci, přidat přepínač, localStorage, převod kotev a ochranu rozpracovaného formuláře. CSS upravit jen v rozsahu potřebném pro přepínač a delší texty.
6. **Ověření:** doplnit cílené testy a provést regresi služby, enginu i administrátorského exportu.
7. **Dokumentace:** aktualizovat [README](../README.md), [architekturu](../docs/architektura.md), [veřejný web](../docs/verejny-web.md) a [rezervace](../docs/rezervace.md) o URL, jazykové složky, chování preference a API hlavičku.

Při úpravách HTML a CSS respektovat příslušná pravidla v `.github/instructions/`. Žádný krok nevyžaduje instalaci balíčků, nový build ani migraci databáze.

## 6. Akceptační kritéria a ověření

### Automatické testy při budoucí implementaci

Použít stávající `node:test`, například nové `tests/i18n.test.js` a `tests/public-localization.test.js`, se skutečnými HTTP požadavky a testovací databází `:memory:` podle existujících exportních testů.

| Oblast | Požadované ověření |
|---|---|
| Routy | Obě úvodní a rezervační stránky vracejí 200, správný jazyk HTML, meta texty, odkazy a kotvy. |
| Vstupní `/` | HTTP 200 obsahuje použitelný český úvod a data pro klientský výběr; nevydává serverový redirect předstírající znalost localStorage. |
| Přesměrování | `/rezervace` vrací 301 na CZ i s query; zvolené veřejné varianty lomítek se kanonizují, API a admin se nemění. |
| Chybové routy | 404/500 a nouzový text odpovídají jazyku prefixu; neznámé jazyky a smíšené slugs nemají úspěšný fallback. API stále vrací JSON. |
| Engine | Vnořené fragmenty každého jazyka se načítají ze správného kořene, chybějící překlad vyvolá chybu; escapování, ochrana cest a limit hloubky zůstávají zachované. |
| Preference a URL mapy | Platná/neplatná/chybějící preference, přednost explicitní URL, výběr cílové stránky, převod kotev a zrušení přepnutí jsou ověřené na oddělitelných pomocných funkcích. |
| Formátování | CZ zachová dosavadní očekávání, EN má například `Fri` / `6 Nov`, `Today`, potvrzení s anglickým dnem a čas `13:00`. Změna jazyka nemění ISO datum ani nabídku slotů. |
| Ceník | Obě sady mají shodné položky v odpovídajícím pořadí a stejné číselné ceny; EN používá CZK. |
| API úspěch | S hlavičkou EN vznikne jediná rezervace a vrátí se anglický `dateLabel`; bez hlavičky zůstane dosavadní česká odpověď. |
| API chyby | CZ/EN validace jednotlivých polí, začatý/plný slot, neplatný JSON, limit těla, typ obsahu a neznámý jazyk vracejí správné statusy a texty; při chybách nic nevznikne. |
| Sdílená kapacita | Rezervace z EN ovlivní dostupnost CZ i českou administraci; neexistují oddělené zásoby stolů podle jazyka. |
| Administrace | Přihlášení, mazání, české formátování a měsíční CSV se nezmění ani při EN hlavičce. Exportní testy nadále procházejí. |
| Úplnost textů | Ověřit naplnění potřebných překladových klíčů, shodné sady veřejných šablon a vygenerované texty pro browser; chybějící proměnné enginu se jinak mohou projevit jen prázdným řetězcem. |

Nejdříve spustit cílené nové testy, poté `npm test` pro regresi sdíleného enginu, služby, HTTP vrstvy a administrace. Nepřidávat nový testovací framework.

### Uživatelský kontrolní průchod po implementaci

- Desktop i mobil: přepínač je viditelný/dosažitelný, ovladatelný klávesnicí, bez narušení menu a aktivních sekcí.
- Čistý prohlížeč: `/` skončí na CZ. Po ruční volbě EN další vstup na `/` skončí na EN; přímé `/cz/rezervace` přesto zůstane česky.
- Starý odkaz `/#nabidka` se při uložené EN dostane na `/en/#menu`. Přepnutí ze sekce i z rezervace vede na významový protějšek.
- Blokované localStorage: web funguje, přepínač naviguje, neúspěšné zapamatování je oznámeno. Vypnutý JavaScript: český vstup a odkazy mezi jazyky fungují, formulář má přeložený telefonický fallback.
- Vyplněný formulář: zrušené upozornění nic nezmění; potvrzené přepnutí údaje zahodí a obnoví dostupnost. Při probíhajícím POST nelze přepnutím vyvolat nejasný nebo duplicitní výsledek.
- V EN projít načítání, prázdnou dostupnost, validační chyby, souběžně zaplněný slot, výpadek i úspěšné potvrzení; včetně oznámení pro čtečku.
- Přepnutí z již potvrzené rezervace žádnou další rezervaci nevytváří. Existující záznam zůstává viditelný v české administraci.

Tento průchod je podkladem pro budoucí ověření, nikoli požadavkem nyní spouštět UI nebo implementovat funkci.

## 7. Známá omezení a stav upřesnění

- localStorage je dostupné jen prohlížeči. Vstupní `/` proto může krátce zobrazit český obsah před klientským přechodem; explicitní jazykové URL už server vracejí přímo ve správném jazyce.
- Bez JavaScriptu nelze automaticky využít uloženou preferenci ani převést aktuální fragment při přepnutí; základní jazykové odkazy však zůstávají funkční.
- Dvě veřejné sady HTML vyžadují při dalších změnách udržovat obě varianty. Shodu struktury, překladových klíčů a číselných cen hlídají testy.
- Současné rozpory o držení stolu a případné jiné nepřesnosti obsahu se pouze přeloží. Nejsou důvodem rozšířit tento úkol o změnu pravidel nebo redakční opravy.
- Zásadní produktové nejasnosti byly s uživatelem upřesněny. Finální anglické věty vzniknou až při implementaci podle zde stanovených pravidel.

**Výstup tohoto kroku je pouze tento dokument. Aplikační kód, konfigurace, databáze ani závislosti se nemění.**
