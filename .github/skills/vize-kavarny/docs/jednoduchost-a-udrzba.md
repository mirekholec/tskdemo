# Jednoduchost a údržba

## Z8 · Jednoduchost před dokonalostí

Aplikaci udržuje jeden externí vývojář v řádu hodin měsíčně. Každá funkce musí být tak jednoduchá, aby to tak zůstalo.

## Pro implementaci

- Platí rozhodnutí v `DECISIONS.md`: žádný framework a žádné npm závislosti bez pádného důvodu.
- Výjimku (například knihovnu pro odesílání e-mailů) posoudí správce webu a zapíše do `DECISIONS.md` i s důvodem.
- Nové provozní hodnoty patří do konfigurace nebo databáze, ne do kódu.
- Rozsáhlé požadavky se dělí na menší dodávky, každá s vlastní hodnotou. Například potvrzení e-mailem jde do provozu dřív než statistiky nepřijetí.
