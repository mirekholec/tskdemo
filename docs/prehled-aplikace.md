---
created: "2026-11-06"
updated: "2026-11-06 13:08"
lastChange: "Vytvořen přehled části Aplikace s rolemi, vědomými omezeními, předností zdrojů a mapou dokumentace."
tags:
  - aplikace
  - prehled-aplikace
---

# Přehled aplikace

Web Kavárny Holubník má tři části: veřejnou prezentaci kavárny, online rezervaci stolu a administraci pro personál. Běží jako jeden Node.js server bez npm závislostí a data ukládá do SQLite. Tento dokument shrnuje role, vědomá omezení a vztah mezi zdroji. Podrobnosti najdete v tematických dokumentech. Spuštění, skripty a strukturu projektu popisuje [README](../../README.md).

## Mapa dokumentace

- [Veřejný web](verejny-web.md): odkud web bere údaje, co je v HTML natvrdo, přístupnost.
- [Rezervace](rezervace.md): sloty, kapacita, rozsah dnů, validace, souběh a průchod hosta formulářem.
- [Administrace](administrace.md): přihlášení, session, seznam a mazání rezervací.
- [Architektura](architektura.md): vrstvy, chybové odpovědi, časové pásmo, šablony, data a technická rozhodnutí.
- [Bezpečnost](bezpecnost.md): na čem stojí ochrana a co aplikace vědomě neřeší.

## Pravidla a záměr

- **Host nemá účet.** Aplikace ho zná jen podle jména a telefonu, které jsou uložené přímo u rezervace. Host není samostatná entita, takže rezervace téhož člověka nejsou nijak propojené (PDF s. 2 „Uživatelé a role“, s. 9 „Datový model“; `src/db/schema.sql:1–8`).
- **Personál sdílí jedno heslo.** Majitelka, provozní i baristé používají stejné přihlášení, vidí nadcházející rezervace a mohou je mazat. Uživatelské účty ani role neexistují, viz [administrace.md](administrace.md).
- **Obsah mění jen správce webu.** Nabídku, ceny, texty i otevírací dobu mění externí vývojář v kódu nebo v konfiguraci. Aplikace nemá rozhraní pro správu obsahu (PDF s. 2 „Uživatelé a role“).

## Rozhodnutí a omezení

- **Omezení jsou vědomá.** Aplikace je záměrně jednoduchá. Chybějící funkce nejsou chyby, ale zásobník dalšího vývoje (PDF s. 2–3 „Co aplikace záměrně nedělá“ a „Původ aplikace“, s. 11 „Funkční omezení aktuální verze“). Chybí:
  - počet osob a poznámka u rezervace;
  - e-maily a SMS a zrušení rezervace hostem;
  - zavírací dny, svátky a jiná otevírací doba o víkendu;
  - historie rezervací a jejich přidávání či úprava v administraci;
  - správa nabídky a jiné jazyky než čeština.

  Jak se jednotlivá omezení projevují v kódu, popisují tematické dokumenty.
- **Pořadí, v jakém se omezení odstraní, určuje byznys, ne technika.** Cílové chování a priority popisuje část III PDF (Vize 2027). Tato dokumentace ji nezpracovává (PDF s. 11 „Kam dál“).
- **Přednost zdrojů:** pokud si část III PDF a starší dokumenty (PRD, PLAN) odporují, platí část III (PDF s. 11 „Kam dál“).
- Část I PDF popisuje stav kódu k 6. 11. 2026 (PDF s. 1 „Historie dokumentu“). Kde se od něj kód liší, uvádějí to sekce *Rozpory a otevřené otázky* v jednotlivých dokumentech.


## Zdroje

- [docs/kavarna-holubnik.pdf](../kavarna-holubnik.pdf): s. 1 „Historie dokumentu“; s. 2–3, kap. 1 Přehled aplikace („Uživatelé a role“, „Co aplikace záměrně nedělá“, „Původ aplikace“); s. 11, kap. 8 Bezpečnost a omezení („Funkční omezení aktuální verze“, „Kam dál“).
- Kód a repozitář: [src/db/schema.sql](../../src/db/schema.sql), [src/config.js](../../src/config.js), [README.md](../../README.md).
