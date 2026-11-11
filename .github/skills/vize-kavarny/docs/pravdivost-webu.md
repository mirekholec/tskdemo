# Pravdivost webu

## Z1 · Web nesmí lhát

Host se rozhoduje podle toho, co vidí na webu. Každá nepravdivá informace, ať jsou to zavřené dveře, nebo falešné „obsazeno“, znamená ztraceného hosta.

## Pro implementaci

- Otevírací doba, výjimky a pravidla rezervace mají jeden zdroj (konfigurace nebo databáze). Šablony je jen zobrazují, texty se neopakují ručně na více místech.
- Rezervace platí na celou hodinu a stůl držíme 15 minut od začátku. Všechny texty na webu to říkají shodně.
- Slot, který už začal, se nikdy neoznačuje jako „obsazeno“. Buď se nezobrazí, nebo má vlastní stav. API proto vrací důvod nedostupnosti, ne jen příznak.
- Zavřeno a zkrácený provoz web oznámí předem: v sekci Návštěva i ve výběru dne rezervace.
