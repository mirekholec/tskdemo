# Jazyky a lokalizace

## Z7 · Připraveni na svět

Turisté jsou nejrychleji rostoucí skupina hostů. Web je musí obsloužit stejně dobře jako sousedy a počítat s tím, že jazyků může přibýt.

## Pro implementaci

- Veřejný web a rezervace jsou česky a anglicky, přepínač CZ / EN v hlavičce. Administrace zůstává jen česky.
- Anglické stránky mají vlastní adresy pod `/en/`, aby je našly vyhledávače.
- Texty jsou oddělené od šablon v souborech podle jazyka. Třetí jazyk (zvažuje se němčina) se přidá bez zásahu do šablon a kódu.
- Jazyk se ukládá k rezervaci. Hlášky formuláře, potvrzení i připomínka jsou v jazyce, ve kterém host rezervoval.
- Položky nabídky mají od začátku i anglický název a popis. Když překlad chybí, zobrazí se česky.
- Ceny jsou vždy v Kč, formát data a času podle jazyka.
