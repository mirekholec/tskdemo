---
id: TASK-015
name: Správa nabídky v administraci
status: new
---

Umožnit personálu samostatně spravovat nabídku kavárny v administraci a na veřejném webu zobrazovat aktuální ceny, pořadí a dostupnost položek.

## Požadavky

- Zdroj požadavku: [e-mail Tomáše ze 30. 10. 2026](../inbox/requirements/15-email-tomas-sprava-nabidky.md). Cílem je odstranit čekání na správce webu při změnách nabídky a vyprodání zboží.
- V existující administraci přidat sekci **Nabídka**, dostupnou pod stejným přihlášením jako rezervace. Personál může přidat, upravit a po potvrzení smazat položku.
- Položka obsahuje název, nepovinný popis, cenu v Kč a kategorii. Výchozí kategorie jsou **Káva**, **Ne-káva** a **Sladké**.
- Umožnit přidat další kategorii, například **Brunch**, bez zásahu do kódu. Samotnou brunchovou nabídku ani termín jejího zveřejnění tento úkol neurčuje.
- Akce **Došlo dnes** položku ihned skryje z veřejné nabídky do konce dne. Akce **Znovu dostupné** umožní zrušit dnešní vyprodání i před koncem dne.
- U položky lze zadat nepovinné období zveřejnění **od–do**. Mimo něj se automaticky nezobrazuje. Bez obou hranic je celoroční; lze vyplnit i jen jednu hranici.
- Položky lze přesouvat nahoru a dolů v rámci kategorie. Při vytvoření nebo přeřazení do jiné kategorie se položka zařadí na její konec.
- Administrace ukazuje také skryté položky, důvod skrytí a nastavené období. Vyprodání ani konec sezóny položku nemažou.
- Všechny změny se ukládají trvale a projeví se při dalším načtení veřejného webu. Zachovat současný vzhled nabídky, kotvu `/#nabidka` a ostatní funkce aplikace.
- Fotografie jednotlivých položek, plná editace a mazání kategorií, změna jejich pořadí, uživatelské role a automaticky se opakující sezóny nejsou součástí tohoto úkolu. Současná společná fotografie nabídky zůstává.

## Technické poznámky

### Výchozí stav a návaznosti

- Nabídka je nyní statická v [menu.html](../src/views/sections/menu.html); [pages.js](../src/routes/pages.js) úvodní stránku pouze renderuje. Administraci, session a změnové formuláře obsluhuje [admin.js](../src/routes/admin.js).
- E-mail a business podklady předcházejí některým úpravám aplikace. **Aktuální HTML už obsahuje cappuccino za 89 Kč, flat white za 95 Kč, caffè latte za 98 Kč a dýňové latte za 105 Kč; fresh pomeranč už neobsahuje.** Převést právě aktuálních 18 položek ve třech kategoriích, včetně popisů a pořadí, nikoli starší ceník.
- Respektovat [architekturu](../docs/architektura.md): čistý JavaScript, SQLite, serverové fragmenty, žádný framework, npm závislost ani build krok. Rezervační kapacita, export, přihlašování a uchovávání rezervací se nemění.
- Kořenový `DECISIONS.md` při přípravě návrhu nebyl nalezen. Před implementací ověřit jeho případné doplnění a relevantní rozhodnutí respektovat; při realizaci zaznamenat nové zásadní rozhodnutí o databázové nabídce a jejím časovém vyhodnocování.

### Navržená pravidla k potvrzení před implementací

- **Došlo dnes** znamená skrytí do nejbližší půlnoci v pásmu **Europe/Prague**, ne na 24 hodin od kliknutí. Další den se položka vrátí pouze tehdy, pokud současně vyhovuje sezónnímu období. Opakované kliknutí během téhož dne nemění výsledek.
- Počáteční i koncové datum sezóny jsou **včetně**. Položka s koncem `2026-11-30` se skryje od `2026-12-01 00:00` pražského času. Období se samo neopakuje následující rok.
- Při převodu stávajícího menu nejsou sezonní data předvyplněná: zdroj neuvádí konec sezóny dýňového latte. Termín určí provozní při editaci, nesmí se odhadnout ze jména položky.
- Cena je kladná částka s nejvýše dvěma desetinnými místy; přijímat českou desetinnou čárku i tečku. Název položky má po ořezání 1–100 znaků, popis nejvýše 500 a název kategorie 1–80. Prázdné nebo duplicitní názvy kategorií odmítnout s konkrétní hláškou.
- Změny se projeví při novém HTTP načtení stránky. Již otevřená stránka se sama neaktualizuje; automatické obnovování ani živé skladové hospodářství nejsou požadované.

### Data, služba a inicializace

- Rozšířit [schema.sql](../src/db/schema.sql) o `menu_categories` (`id`, `name`, `sort_order`) a `menu_items` (`id`, `category_id`, `name`, `description`, `price_minor`, `sort_order`, `sold_out_on`, `available_from`, `available_until`). Cena se ukládá jako celé haléře, data jako `YYYY-MM-DD`, nepoužité hranice a vyprodání jako `NULL`.
- Doplnit databázové kontroly ceny a pořadí, index podle kategorie a pořadí a vazbu položky na existující kategorii. V [database.js](../src/db/database.js) zapnout kontrolu cizích klíčů před transakcemi; existující tabulku rezervací neměnit.
- Přidat `src/db/menu-repository.js` pro parametrizované SQL a transakce a `src/services/menu-service.js` pro validaci, dostupnost a přesuny. Čas `now` předávat službě z handleru, stejně jako u rezervací; využít [dates.js](../src/lib/dates.js).
- Počáteční menu uložit jako strukturovaná data v `src/db/menu-initial-data.js`. První naplnění provést před startem HTTP serveru v jedné transakci a dokončení označit databázovou verzí přes `PRAGMA user_version`. Marker nesmí záviset na počtu položek: po jejich úmyslném smazání se původní nabídka při restartu nesmí obnovit. Při chybě vrátit transakci zpět a start explicitně ukončit s chybou.
- Nabídku inicializovat na nové i existující databázi bez mazání rezervací. Současný příkaz `npm run db:seed` zůstává nástrojem pro rezervace, nesmí přepisovat nabídku.
- Veřejná viditelnost se při každém požadavku odvodí z dnešního data: položka není vyprodaná dnes a splňuje obě vyplněné hranice období. Není potřeba cron ani zápis do databáze o půlnoci; pravidlo funguje i po odstávce serveru.
- Přesun dvou sousedních položek dělat transakčně a v rámci stejné kategorie; přeřazení položky i určení jejího nového pořadí rovněž atomicky. Výpis řadit podle pořadí kategorií, pořadí položek a stabilního ID.

### Administrace a veřejný výpis

- Rozšířit existující `createAdminRoutes` o závislost `menuService` a menu routy pod `/admin/menu`. Použít současný helper kontroly session; **každý** nový GET i POST musí kontrolovat přihlášení před čtením nebo změnou dat.
- GET routy zobrazí seznam, nový formulář a editaci. POST routy obslouží vytvoření, uložení, smazání, vyprodání, obnovení, přesun a přidání kategorie. Úspěšné změny používají přesměrování 303 a českou potvrzovací hlášku; přes GET se žádná data nemění.
- Validační chyby vrátí 400, konkrétní chyby u polí a zachované vstupy. Neplatné či neexistující ID nebo kategorie vrátí srozumitelnou chybu 400/404 bez změny dat. Databázové chyby předat standardní obsluze 500 a logování; nevracet úspěšnou hlášku ani staré statické menu jako náhradu.
- Rozšířit [admin layout](../src/views/layouts/admin.html) o navigaci Rezervace/Nabídka a odpovídající označení sekce. Zachovat možnost odhlášení také z nabídky. Formuláře a tlačítka musí jít ovládat na tabletu i klávesnicí; pořadí nesmí vyžadovat drag-and-drop.
- V `src/views/pages/admin/` přidat stránky seznamu a formuláře; opakované řádky, položky a kategorie renderovat samostatnými fragmenty. Zachovat oddělené administrační styly a existující potvrzení mazání v [admin skriptu](../src/assets/js/admin.js).
- Zapojit službu přes [server.js](../src/server.js) a [app.js](../src/app.js) do administračních i veřejných rout. V `home` sestavit kategorie a položky pomocí `renderFragment()` a výsledné HTML předat do fragmentu nabídky.
- Uživatelské názvy, popisy i kategorie vždy vkládat escapovanými `{{ }}`. `{{{ }}}` používat výhradně pro HTML složené serverem z bezpečných fragmentů. Cenu formátovat česky s Kč, celé ceny bez zbytečného `,00`.
- Na veřejném webu skrýt kategorie bez viditelných položek. Pokud není vidět žádná položka, zachovat sekci a zobrazit „Nabídku právě aktualizujeme.“ Pro úvodní stránku nepoužívat cache, která by obcházela aktuální dostupnost.

### Orientační pracnost

- Datový model a bezpečný převod: **4–6 h**; služba a pravidla dostupnosti: **4–6 h**; administrace: **8–12 h**; veřejný výpis: **2–3 h**; testy a dokumentace: **6–9 h**.
- Celkem předběžně **24–36 hodin** bez fotografií a rozšíření rozsahu. Nejde o cenovou nabídku: cena je počet hodin × dohodnutá sazba, která v podkladech není uvedena. Rozsah a výslednou cenu schvaluje majitelka před realizací; roční rozpočet na rozvoj webu 150 000 Kč není rozpočtem pouze tohoto úkolu.

## Implementační plán

1. **Potvrdit rozsah a provozní pravidla.** S Tomášem potvrdit půlnoční návrat, inkluzivní data sezóny, přidávání kategorií a cenovou validaci; s Janou schválit odhad a cenu. Prověřit `DECISIONS.md` a instrukce pro upravované HTML/CSS. Zachytit aktuálních 18 položek jako podklad pro převod a regresní test.
2. **Připravit úložiště a jednorázový převod.** Přidat schéma, menu repozitář, strukturovaná výchozí data a verzovanou transakční inicializaci. Ověřit zachování existujících rezervací, opakovaný start, rollback a stav po smazání celé nabídky. Před nasazením změny zazálohovat databázi konzistentním SQLite postupem.
3. **Implementovat a otestovat službu.** Doplnit validaci vstupů, CRUD položek, přidání kategorie, dnešní vyprodání/obnovení, sezonní dostupnost a transakční změny pořadí. Nejdříve pokrýt pravidla deterministickými testy nad `:memory:` a pevným `now`.
4. **Zapojit službu do aplikace a administrace.** Rozšířit sestavení aplikace a současné testovací setupy o menu službu, přidat chráněné routy, formuláře, stavy, navigaci a potvrzení. Ověřit HTTP přístup se session i bez ní a při jejím vypršení.
5. **Nahradit statickou nabídku dynamickým výpisem.** V úvodní routě vykreslit dostupné položky ve správném pořadí a stávajících třídách; doplnit prázdný stav. Ověřit escapování a propojení změn v administraci s následujícím veřejným požadavkem.
6. **Ověřit celek a regresi.** Přidat `tests/menu-service.test.js`, `tests/menu-initialization.test.js` a `tests/menu-http.test.js`. Spustit cíleně `node --test tests/menu-service.test.js tests/menu-initialization.test.js tests/menu-http.test.js`, následně `npm test`, protože se mění společné sestavení aplikace. HTTP testy používat s dočasnou databází a vlastním portem, ne proti provozním datům. Automatizované testování UI není součástí tohoto kroku.
7. **Dokumentovat a předat.** Aktualizovat [administraci](../docs/administrace.md), [veřejný web](../docs/verejny-web.md), [architekturu](../docs/architektura.md) a [README](../README.md) včetně původu menu, obsluhy vyprodání, období a omezení. Zapsat zásadní rozhodnutí do `DECISIONS.md` s datem a důvodem. Předat personálu postup a nechat Tomáše potvrdit ovládání na používaném tabletu.

## Akceptační kritéria

- [ ] Úkol používá stávající sdílené přihlášení. Všechny menu GET/POST bez platné session nebo s prošlou session přesměrují na `/admin`; nečtou chráněná data ani nic nemění.
- [ ] První start převede přesně aktuálních 18 položek do kategorií Káva/Ne-káva/Sladké se stejnými názvy, popisy, cenami a pořadím. Uvedené čtyři listopadové ceny zůstanou zachované a fresh pomeranč se nevrátí.
- [ ] Převod zachová všechny existující rezervace. Opakovaný start menu neduplikuje ani nepřepisuje; po smazání všech položek a restartu zůstane nabídka prázdná. Neúspěšná inicializace neoznačí převod za dokončený a nezanechá částečná data.
- [ ] Přihlášený personál vytvoří, upraví a po potvrzení smaže položku. Každá změna je patrná v dalším veřejném HTTP výpisu i po restartu serveru.
- [ ] Lze vytvořit kategorii Brunch a zařadit do ní položku bez úpravy šablon nebo konfigurace. Kategorie bez veřejně dostupných položek nevytváří prázdnou kartu.
- [ ] Kliknutí **Došlo dnes** skryje položku během dne; ve `23:59:59` pražského času zůstává skrytá a od následující `00:00:00` se vrátí, pokud vyhovuje období. Funguje to i při přechodu letního/zimního času a restartu přes půlnoc.
- [ ] Akce **Znovu dostupné** zruší dnešní vyprodání, ale neobejde sezónní období. Vyprodaná nebo sezonní položka zůstává v administraci editovatelná se srozumitelným stavem.
- [ ] Období `2026-11-01` až `2026-11-30` zveřejní položku právě od začátku 1. listopadu do konce 30. listopadu v Europe/Prague; mimo něj je skrytá. Ověřeny jsou i nevyplněné/jednostranné hranice, neexistující datum a konec před začátkem.
- [ ] Přesuny nahoru/dolů se shodně projeví v administraci i na webu a přežijí restart. Přesun na hranici seznamu nemění data ani pořadí jiné kategorie; přeřazení zařadí položku na konec cílové kategorie.
- [ ] Chybějící název, příliš dlouhý text, nekladná nebo neplatná cena, více než dvě desetinná místa a neexistující kategorie vrátí 400 s konkrétní hláškou a bez částečného zápisu. Cena `105,50` i `105.50` se uloží jako 10 550 haléřů a zobrazí jako `105,50 Kč`.
- [ ] HTML v názvu, popisu nebo kategorii se na veřejné i administrační stránce zobrazí jako text, nikdy se nevykoná. Neexistující položka má explicitní 404 a chyba databáze standardní 500 s logováním, nikoli úspěšný či statický náhradní výpis.
- [ ] Při prázdné nabídce zůstane kotva `/#nabidka`, informace o rostlinném mléku a společná fotografie a zobrazí se definovaná hláška. Ostatní sekce, rezervace, odhlášení a CSV export fungují beze změny.
- [ ] Cílené menu testy i stávající sada `npm test` procházejí; dokumentace odpovídá novému chování a Tomáš potvrdil základní obsluhu na tabletu.
