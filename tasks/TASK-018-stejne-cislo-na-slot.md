---
id: TASK-018
todoist-id: 6hwVHWR65Fjrrr34
name: Stejné telefonní číslo na jeden slot
status: new
---

Online rezervace odmítne druhou a další rezervaci se stejným telefonním číslem na stejný den a hodinu, přičemž `+420 777 222 333` a `777222333` se považují za stejné číslo.

## Požadavky

- Zdroj požadavku: Todoist task „kuba-stejne-cislo (10)“ (požadavek 10 „Podezřelé rezervace“ z roadmapy, fáze 0, zásada Z4). Komentář k tasku: pravidlo se má nastavit systémově, tedy kontrolovat telefonní číslo na čas.
- Motivace: v pátek v 17:00 bylo 5 rezervací na stejné číslo pod různými jmény (blokování stolů). Zároveň může jít o kamaráda, který rezervuje pro celou partu.
- Pravidlo od Jany: **nejvýše 1 rezervace (stůl) na jedno číslo ve stejném slotu** (stejné datum + stejná hodina). Kdo chce víc stolů, zavolá.
- Stejné číslo se pozná po normalizaci: bez mezer a `+`, bez předvolby `420` / `00420`. Zápisy `+420 777 222 333`, `00420777222333`, `420777222333` a `777222333` jsou jedno číslo.
- Stejné číslo může rezervovat **jiný slot** (jiný den nebo jinou hodinu), pravidlo se týká jen shody v jednom slotu.
- Host dostane srozumitelnou hlášku u pole Telefon, např. „Na toto číslo už je v tomto čase rezervace. Pro více stolů nám prosím zavolejte.“ (text s telefonem kavárny z konfigurace je vítaný, ale nepovinný).
- Kontrola neposouvá pravidla kapacity: plný slot dál končí chybou `SlotFullError` (409). Při obou důvodech odmítnutí má přednost kontrola duplicity telefonu před kapacitou.
- Ruční mazání stávajících pátečních podezřelých rezervací provede personál v administraci. Součástí implementace to není.

## Technické poznámky

- Pravidla vynucuje jediná služba `src/services/reservation-service.js` (funkce `createReservation`), prohlížeč rozhoduje jen pro pohodlí. Kontrola musí proběhnout **uvnitř** stávající synchronní transakce `repository.transaction(...)` vedle `countBySlot`, jinak ji půjde obejít souběžným odesláním. Nepřidávat `await` mezi kontrolu a `insert`.
- SQL patří jen do `src/db/reservations-repository.js`. Přidat parametrizovaný dotaz např. `phonesBySlot(date, hour)` (`SELECT phone FROM reservations WHERE date = ? AND hour = ?`, využije index `idx_reservations_slot`). Počet řádků je nejvýše kapacita slotu (5), takže porovnání lze udělat v JS.
- Normalizace v nové čisté funkci `normalizePhone` v novém souboru `src/lib/phone.js` (jen číslice; při délce nad 9 číslic odstranit úvodní `00420` nebo `420`). Uložené telefony se **nemění ani nemigrují**, schéma a `schema.sql` zůstávají beze změny, porovnávají se normalizované hodnoty. Starší záznamy uložené s `+420` nebo bez něj se tak porovnají správně.
- Úplná normalizace při ukládání na E.164 a přijetí pomlček patří do požadavku 05 (jiný task). Tento task na něm nezávisí, ale `normalizePhone` má být napsaná tak, aby ji TASK 05 a historie (TASK-017, vyhledávání podle telefonu) mohly sdílet.
- Chyba jako `ValidationError({ phone: '…' })` (400 s `fields.phone`): stávající `src/assets/js/reservation.js` ji zobrazí u pole Telefon a nastaví fokus, takže **není potřeba měnit frontend ani API** (`src/routes/reservations-api.js`). Kód 409 zůstává vyhrazen pro plný slot.
- Hláška se vyhodí z transakce, takže se provede `ROLLBACK` (viz `transaction` v repository). Ověřit, že `ValidationError` z uvnitř transakce propadne beze změny.
- Existující testy `odmítne šestou rezervaci ve stejném slotu` a `ukazuje počet volných míst…` v `tests/reservation-service.test.js` plní slot opakovaně se stejným `VALID_INPUT.phone`. Po změně by selhaly, proto je potřeba použít pro každou rezervaci jiné číslo (pomocná funkce generující telefon podle indexu).
- Seed (`src/db/seed.js`) zapisuje přímo přes repozitář a pravidlo obchází. Čísla v `GUESTS` jsou různá, takže data zůstávají konzistentní. Bez změny.
- Dokumentace: aktualizovat `docs/rezervace.md` (sekce „Telefon není identifikátor“, „Validace údajů“, „Průchod hosta formulářem“, případně „Souběh“ včetně front matteru `updated` a `lastChange`) a věty o propojení rezervací v `docs/prehled-aplikace.md` (ř. 24), pokud přestanou platit.
- Mimo rozsah: normalizace uloženého telefonu a přijímání pomlček (požadavek 05), stavy rezervací, blokace po no-show (04B), mazání pátečních rezervací, limit rezervací na IP/rate limiting, změna datového modelu, počet osob (požadavek 12).

## Implementační plán

Při návrhu implementačního plánu je nutné, aby následující kroky na sebe navazovaly v tomto pořadí. Je přitom možné mezi tyto kroky přidat kroky jiné.

1. Prostudovat `docs/rezervace.md` a `src/services/reservation-service.js` (`validate`, `createReservation`) a nastavit status tohoto tasku na `inprogress`.
2. Vytvořit `src/lib/phone.js` s exportovanou `normalizePhone(value)` (číslice, odstranění předvolby `420` / `00420` jen při délce nad 9 číslic) a doplnit testy `tests/phone.test.js` (formáty `+420 777 222 333`, `00420777222333`, `420777222333`, `777222333`, jiná čísla, prázdný vstup).
3. Do `src/db/reservations-repository.js` přidat prepared statement a metodu `phonesBySlot(date, hour)` vracející pole uložených telefonů daného slotu.
4. V `src/services/reservation-service.js` přidat novou chybovou cestu: uvnitř `repository.transaction` po kontrole kapacity (nebo před ní, viz požadavky: duplicita má přednost) porovnat `normalizePhone(phone)` s normalizovanými hodnotami z `phonesBySlot`; při shodě vyhodit `ValidationError({ phone: … })`. Text hlášky držet jako konstantu ve službě (jediný zdroj, API ho předává beze změny).
5. Upravit existující testy v `tests/reservation-service.test.js` (různá čísla při plnění slotu) a doplnit nové: druhá rezervace stejného čísla ve stejném slotu se odmítne; shoda napříč zápisy (`+420 777 222 333` vs. `777222333`); stejné číslo v jiné hodině a v jiný den projde; jiné číslo ve stejném slotu projde; smazání rezervace číslo uvolní; duplicita má přednost před plným slotem.
6. Ověřit ručně: `npm run dev`, `/rezervace`, dvě rezervace stejného čísla v jednom čase (hláška u pole Telefon, fokus, formulář zůstane vyplněný) a stejné číslo v jiném čase.
7. Aktualizovat dokumentaci v `docs/` (viz technické poznámky) a po dokončení nastavit status tasku na `completed` a přesunout soubor do `tasks/completed`.
8. Spustit `npm test` a opravit případné regrese.

## Akceptační kritéria

- Druhá online rezervace se stejným číslem na stejný den a hodinu je odmítnuta (HTTP 400, `fields.phone`) a v databázi nevznikne žádný záznam.
- `+420 777 222 333`, `00420 777 222 333`, `420777222333` a `777222333` se berou jako stejné číslo, včetně porovnání s dříve uloženým záznamem v jiném zápisu.
- Stejné číslo lze rezervovat na jinou hodinu nebo jiný den. Jiné číslo ve stejném slotu projde (do kapacity 5).
- Po smazání rezervace v administraci lze číslo ve slotu znovu použít.
- Chyba se v rezervačním formuláři ukáže u pole Telefon srozumitelným textem a hodnoty ve formuláři zůstanou zachovány.
- Plný slot dál vrací 409 `slot_full`. Souběžné odeslání dvou stejných čísel nevytvoří dvě rezervace (kontrola je v transakci).
- `npm test` projde, nové testy pokrývají normalizaci i pravidlo ve službě. Schéma databáze se nezměnilo.
- Dokumentace v `docs/` odpovídá novému chování (telefon už není zcela volný údaj).
