---
created: "2026-11-06"
updated: "2026-11-06 13:08"
lastChange: "Vytvořen popis pravidel rezervací, souběhu, průchodu hosta a dopadů změn konfigurace."
tags:
  - aplikace
  - rezervace
---

# Rezervace

Pravidla online rezervace stolu a průchod hosta formulářem na `/rezervace`. Všechna pravidla vynucuje jediný modul `src/services/reservation-service.js`. Prohlížeč kontroluje vstupy jen pro pohodlí hosta, rozhoduje vždy server (PDF s. 4, kap. 3).

## Pravidla a záměr

### Slot a kapacita

- Rezervace je vždy na celou hodinu a začíná v celou hodinu. Sloty se odvozují z otevírací doby: `open` platí včetně, `close` vyjma a poslední slot končí v okamžiku zavření. Při době 13–20 je to 7 slotů, 13:00 až 19:00 (PDF s. 4 „Časové sloty“; `src/services/reservation-service.js:44–48`; `src/config.js:19–20`).
- Otevírací doba je jedna pro všechny dny v týdnu. Zavírací dny ani svátky aplikace nezná (PDF s. 4).
- Na jeden slot lze přijmout nejvýše `capacityPerSlot` rezervací (5). Jedna rezervace odpovídá jednomu stolu. Počet osob se neeviduje, takže aplikace nerozlišuje stůl pro dva a pro šest. Větší skupiny web odkazuje na telefon (PDF s. 4 „Kapacita“, s. 6 „Postranní panel“; `src/views/pages/reservation.html:67`).
- **Kapacitu hlídá jen služba.** Databáze počet rezervací na slot neomezuje. Hodinu omezuje jen na rozsah 0–23, ne na otevírací dobu (`src/db/schema.sql:4`). Kód, který zapisuje mimo službu, pravidla obchází. Dnes to dělá seed, viz *Rozhodnutí a omezení*.

### Rozsah dnů a „dnes“

- Rezervovat lze od dneška na `daysAhead` dní (14). Dnešek se počítá, posledním dnem je tedy dnes + 13 (PDF s. 4 „Rozsah dnů“; `parseBookableDate`, `src/services/reservation-service.js:55–63`).
- Slot, který už začal, nelze rezervovat. Za začatý se považuje od své první sekundy, takže ve 13:00:00 už slot 13:00 rezervovat nejde (`hasSlotStarted`, ř. 50–53).
- Jakmile začne poslední slot dne (od 19:00), dnešek se v nabídce dnů vůbec neobjeví (`getAvailableDays`, ř. 73–76). API ale na dotaz na dnešek dál odpovídá platně, jen jsou všechny sloty nerezervovatelné.
- Všechny časy se počítají v pásmu Europe/Prague. Toto společné pravidlo a jeho úskalí popisuje [architektura.md](architektura.md) v části *Časové pásmo*.

### Validace údajů

Server zkontroluje všechna pole najednou a ke každému chybnému poli vrátí vlastní chybu. Texty hlášek jsou součástí služby a API je předává beze změny (PDF s. 5 „Validace údajů“; `validate`, ř. 110–142).

- **Jméno:** po ořezání okrajových bílých znaků 2–80 znaků. Délka se počítá v kódových bodech Unicode (ř. 112, 117–120).
- **Telefon:** nejdřív se odstraní bílé znaky, potom musí číslo odpovídat volitelnému `+` a 9–15 číslicím. Ukládá se bez mezer (ř. 113, 122–124).
- **Den:** existující kalendářní datum ve formátu `YYYY-MM-DD` v povoleném rozsahu. Neexistující datum, například 30. 2., se odmítne (`parseIsoDate`, `src/lib/dates.js:31–41`).
- **Hodina:** musí odpovídat jednomu z aktuálních slotů a slot nesmí být začatý. Z JSON se přijme číslo, z formuláře text o jedné až dvou číslicích (ř. 35–41, 131–135).

### Telefon není identifikátor

Číslo se nijak nenormalizuje. `+420 777 222 333` a `777222333` jsou pro aplikaci dvě různá čísla a zápis s pomlčkami validací neprojde. Počet rezervací na jedno číslo není omezený (PDF s. 5 „Jak se zachází s telefonem“). Párování rezervací podle telefonu proto dnes nepozná stejné číslo zapsané jinak.

## Netriviální postupy

### Souběh při vytváření rezervace

- Kontrola kapacity a vložení proběhnou v jedné transakci `BEGIN IMMEDIATE`. Dva hosté, kteří odešlou formulář ve stejnou chvíli, tak slot nepřeplní (PDF s. 4 „Kapacita“; `createReservation`, ř. 147–153; `transaction`, `src/db/reservations-repository.js:55–66`).
- V rámci jednoho procesu se požadavky nepromíchají už proto, že celé vytvoření rezervace je synchronní: `DatabaseSync` z `node:sqlite` a žádné `await` mezi kontrolou a vložením. Zámek pro zápis má význam hlavně při více procesech nad jedním souborem databáze, například u druhé instance serveru nebo při `npm run db:seed`. Čekající proces počká na zámek až 5 s (`busy_timeout`, `src/db/database.js:22–23`).
- **Pozor při úpravách:** `transaction()` zavolá předanou funkci a hned transakci potvrdí. Asynchronní funkce by se potvrdila dřív, než doběhne, a atomicita by se ztratila. Kontrola a zápis proto musí zůstat synchronní, jinak je potřeba transakci přepsat.

### Dostupnost slotů

Ke každému slotu dne služba vrací počet volných míst `available`, který nikdy neklesne pod nulu. Příznak `bookable` platí, když je ve slotu volné místo a slot ještě nezačal (`getSlots`, ř. 88–108).

### Průchod hosta formulářem

- Nabídku dnů vykreslí server při načtení stránky. Volné časy načítá prohlížeč přes `GET /api/slots` a formulář odesílá jako JSON na `POST /api/reservations` bez obnovení stránky. Bez JavaScriptu rezervace nefunguje a stránka zobrazí telefon kavárny (PDF s. 5–6, kap. 4; `src/routes/pages.js:22–38`; `src/views/pages/reservation.html:45`).
- **Kontrola v prohlížeči pravidla duplikuje.** Limity jména a vzor telefonu jsou zkopírované ze služby (`src/assets/js/reservation.js:3–5` a `src/services/reservation-service.js:15–17`). Při změně pravidla je potřeba upravit obě místa. Jinak prohlížeč hosta zastaví zbytečně, nebo ho nechá odeslat formulář, který odmítne až server.
- **Prohlížeč rozlišuje jen tři odpovědi** (`src/assets/js/reservation.js:189–204`):
  - 201: potvrzení se dnem, časem a jménem;
  - 400 s chybami u polí: hláška u konkrétního pole a fokus na první chybné pole;
  - 409, slot se mezitím zaplnil: hláška a nové načtení slotů.

  Všechno ostatní, včetně chyb při čtení těla požadavku (400 bez chyb u polí, 413, 415) a chyby 500, prohlížeč ukáže jako výpadek s výzvou zavolat. Kódy chyb API popisuje [architektura.md](architektura.md).

## Rozhodnutí a omezení

- **Rezervace nemá stav** (potvrzená, zrušená, nepřišel) a mazání je fyzické. Potvrzuje se okamžitě, bez e-mailu a SMS. Host ji nemůže sám zrušit a potvrzení ho vyzve, ať zavolá (PDF s. 2–3, s. 9 „Datový model“, s. 11; `src/views/pages/reservation.html:52`).
- **Pravidlo „stůl držíme 15 minut“ existuje jen jako text pro hosta.** Aplikace ho nevynucuje a rezervace zabírá místo ve slotu celou hodinu, ať host přijde, nebo ne (`src/views/pages/reservation.html:66`; `getSlots`). Doba držení je v konfiguraci `reservations.holdMinutes` (15) a texty na webu ji berou odtud, viz [verejny-web.md](verejny-web.md).
- **Změny konfigurace a existující data.** Konfigurace se načte při startu, takže změna se projeví až po restartu serveru (`npm run dev` restartuje sám). Rezervace jsou uložené jako místní datum a hodina bez časové zóny (`src/db/schema.sql:3–4`). Z toho plyne:
  - Po zúžení otevírací doby zůstanou v databázi rezervace v hodinách, které už nejsou sloty. Administrace je dál ukazuje, ale do dostupnosti se nezapočítají (`getSlots`, ř. 98; `listUpcoming`, ř. 166–172).
  - Po snížení `capacityPerSlot` pod současný počet služba další rezervace nepřijme, ale stávající nadpočetné nezruší. Hodnota `available` se ořízne na 0 (ř. 99).
  - Změna `timezone` změní výklad všech uložených časů.
- **Seed pravidla obchází.** `npm run db:seed` smaže všechny rezervace a vloží 20 ukázkových na zítřek až šest dní dopředu, z toho jeden slot plně obsazený. Zapisuje přímo přes repozitář, takže hodiny a počty nekontroluje proti konfiguraci. Spuštěný nad databází se skutečnými rezervacemi je smaže (PDF s. 10 „Spuštění“; `src/db/seed.js:28–61`).

## Rozpory a otevřené otázky

- **Plný a začatý slot vypadají stejně, i když je API rozlišit umí.** Podle PDF vrací API u slotu jen příznak `bookable` bez důvodu. Prohlížeč proto ukáže plný i začatý slot jako „obsazeno“ a dnešek může odpoledne vypadat plně obsazený, i když je kavárna prázdná (PDF s. 6 „Plný a začatý slot vypadají stejně“). API ale vrací i `available`, jak uvádí i PDF na s. 9 „JSON API“, a prohlížeč tuto hodnotu u nerezervovatelného slotu ignoruje (`src/assets/js/reservation.js:96`). Začatý slot s volným místem tedy jde poznat už dnes. Nepoznáme jen slot, který začal a zároveň je plný. Otevřená otázka: doplnit důvod do API, nebo stačí úprava v prohlížeči?
- **Telefon:** PDF píše, že validace odstraňuje „jen mezery“. Kód na serveru i v prohlížeči odstraňuje všechny bílé znaky, tedy i tabulátory a nezlomitelné mezery (`src/services/reservation-service.js:113`, `src/assets/js/reservation.js:141`). U pomlček a jiných oddělovačů se kód chová podle PDF.

## Zdroje

- [docs/kavarna-holubnik.pdf](../kavarna-holubnik.pdf): s. 4–5, kap. 3 Rezervace: pravidla („Časové sloty“, „Kapacita“, „Rozsah dnů“, „Validace údajů“, „Jak se zachází s telefonem“, „Funkce služby“); s. 5–6, kap. 4 Rezervace: průchod hosta („Stavy a hlášky“, „Plný a začatý slot vypadají stejně“, „Postranní panel“); s. 9 „Datový model“ a „JSON API“; s. 10 „Spuštění“; s. 11 „Funkční omezení aktuální verze“.
- Kód: [src/services/reservation-service.js](../../src/services/reservation-service.js), [src/db/reservations-repository.js](../../src/db/reservations-repository.js), [src/db/database.js](../../src/db/database.js), [src/db/schema.sql](../../src/db/schema.sql), [src/db/seed.js](../../src/db/seed.js), [src/lib/dates.js](../../src/lib/dates.js), [src/config.js](../../src/config.js), [src/routes/pages.js](../../src/routes/pages.js), [src/views/pages/reservation.html](../../src/views/pages/reservation.html), [src/assets/js/reservation.js](../../src/assets/js/reservation.js).
