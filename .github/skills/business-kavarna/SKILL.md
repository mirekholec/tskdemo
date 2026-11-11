---
name: business-kavarna
description: Business plán Kavárny Holubník (Praha-Vinohrady), tedy kdo kavárna je, zákazníci a sezónnost, nabídka a ceny, místa a kapacita, rezervace a no-show, tým a role, finance a cíle 2027, marketing a rizika. Použij, když úkol, požadavek nebo rozhodnutí potřebuje byznysový kontext kavárny, například priority, čísla, ceník, kapacitu stolů, segmenty hostů, kdo co v týmu dělá nebo dopad změny na tržby.
user-invocable: true
disable-model-invocation: false
---

# Business kontext Kavárny Holubník

## Účel

Skill dává agentovi byznysový kontext kavárny: fakta, čísla a provozní pravidla z business plánu. Obsah je převzatý z části II dokumentu `docs/kavarna-holubnik.pdf` a rozdělený podle problémových oblastí, aby se načítalo jen to, co úkol potřebuje.

## Kdy použít

- Posuzuješ nebo upřesňuješ požadavek (`requirements/`, `tasks/`) a potřebuješ vědět, proč na něm kavárně záleží.
- Potřebuješ konkrétní údaj: otevírací dobu, ceny, počet míst, statistiky rezervací, rozpočet, kontakty.
- Rozhoduješ o prioritách nebo navrhuješ řešení a chceš znát dopad na tržby, no-show nebo provoz.
- Píšeš texty pro web nebo hosty a potřebuješ znát koncept, hodnoty a segmenty zákazníků.

**Kdy nepoužít:** pro technický popis současné aplikace (část I PDF, viz `docs/aplikace/`) ani pro vizi 2027 a zásady Z1–Z8 (část III PDF). Ty tento skill neobsahuje.

## Jak postupovat

1. Podle tabulky níže vyber soubor nebo soubory, které odpovídají otázce. Nenačítej všechny najednou.
2. Údaje uváděj tak, jak jsou ve zdroji. Pokud zdroj něco neříká, napiš to a nedomýšlej.
3. Údaje platí k 6. 11. 2026. Pozor na rozdíl mezi novým ceníkem a cenami na webu (viz `nabidka-a-ceny.md`) a mezi kapacitou v aplikaci a skutečnými místy (viz `mista-a-kapacita.md`).

## Obsah

| Soubor | Oblast | Popis |
|---|---|---|
| [kavarna-v-kostce.md](kavarna-v-kostce.md) | Kavárna v kostce | Základní údaje (adresa, provozovatel, otevírací doba, kontakty, prostor, doprava), klíčová čísla, příběh, tři hodnoty, lokalita a konkurence. |
| [zakaznici-a-sezonnost.md](zakaznici-a-sezonnost.md) | Zákazníci a sezónnost | Pět segmentů hostů s podílem na tržbách a jejich potřebami, turisté a jazyková bariéra, silné a slabé měsíce. |
| [nabidka-a-ceny.md](nabidka-a-ceny.md) | Nabídka a ceny | Tři kategorie a 18 položek s cenami, průměrná útrata, nejprodávanější položky, nový ceník od listopadu 2026. |
| [mista-a-kapacita.md](mista-a-kapacita.md) | Místa a kapacita | Rozložení 36 míst a 9 stolů, které jsou rezervovatelné (5 stolů, 18 míst), nesoulad s kapacitou v aplikaci. |
| [rezervace-a-no-show.md](rezervace-a-no-show.md) | Rezervace a no-show | Statistiky rezervací za říjen 2026, no-show a jeho ztráta, telefonické rezervace, provozní zvyklosti (1 hodina, 15 minut, skupiny). |
| [tym-a-role.md](tym-a-role.md) | Tým a role | Lidé v kavárně i externisté, jejich role a vztah k aplikaci. |
| [finance-a-cile.md](finance-a-cile.md) | Finance a cíle 2027 | Měsíční hospodaření 2026 po položkách, cíle na rok 2027, rozpočet na web, zdroje růstu. |
| [marketing.md](marketing.md) | Marketing | Kanály (Instagram, Facebook), Google recenze, sezónní a komunitní akce, role webu. |
| [rizika.md](rizika.md) | Rizika | Šest hlavních rizik s dopadem a opatřením, odkazy na zásady Z1, Z2, Z5 a Z6. |
