# Anglická verze webu
- bude se týkat jen veřejné části, administrace zůstane česky
- změnit se musí texty a popisy, ceny zůstanou v CZK
- připravit se výhledově na variantu, že přibude německá verze

## Technicky
- šablony budou mít nyní 2 verze CZ a EN (složky)
- routování na šablonu dle jazyka (cz, en)
- web bude mít v URL buď cz/nazev-stranky nebo en/page-name
- tedy překládat se musí i url slug

## Přepínání
- výchozí jazyk vždy CZ
- přepínání v hlavičce webu
- uložení do local storage
- není potřeba consent na cookies