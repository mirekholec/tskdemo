---
name: vize-kavarny
description: Vize Kavárny Holubník pro rok 2027, cíle, zásady Z1–Z8, provozní parametry, roadmapa a dopad na požadavky 01–15. Pouze na výslovné vyvolání uživatelem při upřesňování požadavků, určování priorit nebo návrhu změn aplikace podle vize kavárny.
user-invocable: true
disable-model-invocation: true
---

# Vize Kavárny Holubník

## Účel

Skill poskytuje kontext pro rozvoj aplikace podle vize kavárny: cíle pro rok 2027, závazné zásady, cílové provozní hodnoty a pořadí dodávek. Nezahrnuje business plán ani technický popis současné aplikace.

## Vyvolání

Skill vyvolává výhradně uživatel příkazem `/vize-kavarny`. Model ho nesmí vyvolávat automaticky.

## Kdy použít

- Upřesňuješ požadavek a potřebuješ ověřit jeho soulad s vizí a zásadami Z1–Z8.
- Určuješ priority, termíny nebo závislosti mezi požadavky.
- Navrhuješ změny rezervací, administrace, nabídky nebo jazykových verzí.
- Potřebuješ cílové provozní hodnoty a data jejich platnosti.

## Jak postupovat

1. Podle tabulky načti jen dokumenty relevantní pro úkol, ne všechny najednou.
2. Zachovej uvedené hodnoty, termíny a rozdíl mezi současným a cílovým stavem. Co není uvedeno, nedomýšlej.
3. Při rozporu se staršími dokumenty PRD a PLAN má přednost tato vize.
4. Zásady platí pro každý úkol, i když je zadání nezmiňuje. Rozpor požadavku se zásadou nejprve vyjasni s majitelkou.
5. Pořadí fází roadmapy je závazné; pořadí uvnitř fáze určuje správce webu podle náročnosti.

## Obsah

| Soubor | Oblast | Popis |
|---|---|---|
| [vize-a-cile.md](docs/vize-a-cile.md) | Vize a cíle 2027 | Čtyři cíle, vánoční termín, hranice toho, co kavárna chce a nechce, a závaznost zásad. |
| [pravdivost-webu.md](docs/pravdivost-webu.md) | Pravdivost webu (Z1) | Jeden zdroj informací, jednotná pravidla rezervace, stavy slotů a oznámení omezeného provozu. |
| [rezervace-a-no-show.md](docs/rezervace-a-no-show.md) | Rezervace a no-show (Z2) | Potvrzení, připomínka, zrušení, stavy rezervace a blokace opakovaného nepřijetí. |
| [kapacita-a-pocet-osob.md](docs/kapacita-a-pocet-osob.md) | Kapacita a počet osob (Z3) | Společná kapacita 18 míst, rezervace pro 1–6 osob, poznámka a vědomé překročení kapacity personálem. |
| [identita-hosta.md](docs/identita-hosta.md) | Identita hosta (Z4) | Normalizace telefonu do E.164 a nejvýše jedna rezervace na číslo a slot. |
| [samostatnost-personalu.md](docs/samostatnost-personalu.md) | Samostatnost personálu (Z5) | Administrace na tabletu, telefonické rezervace, správa nabídky a oddělený přístup účetní. |
| [ochrana-osobnich-udaju.md](docs/ochrana-osobnich-udaju.md) | Ochrana osobních údajů (Z6) | Rozsah ukládaných údajů, anonymizace po 12 měsících a omezení historie, exportu a použití e-mailu. |
| [jazyky-a-lokalizace.md](docs/jazyky-a-lokalizace.md) | Jazyky a lokalizace (Z7) | Český a anglický web, adresy pod /en/, překlady nabídky a komunikace v jazyce hosta. |
| [jednoduchost-a-udrzba.md](docs/jednoduchost-a-udrzba.md) | Jednoduchost a údržba (Z8) | Technická rozhodnutí, odůvodněné závislosti, konfigurovatelné hodnoty a malé samostatné dodávky. |
| [provozni-parametry.md](docs/provozni-parametry.md) | Provozní parametry | Současné a cílové hodnoty s daty platnosti, včetně nutnosti nastavit lednové víkendy už v prosinci. |
| [roadmapa-a-pozadavky.md](docs/roadmapa-a-pozadavky.md) | Roadmapa a požadavky | Fáze 0–3, termíny, dopad vize na požadavky 01–15 a jejich závislosti. |
