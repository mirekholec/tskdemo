# Identita hosta

## Z4 · Telefon je identita hosta

Hosté nemají účty. Hosta poznáme podle telefonního čísla, proto musí být číslo vždy uložené stejně.

## Pro implementaci

- Telefon přijímáme v jakémkoli běžném zápisu: mezery, pomlčky, tečky, závorky, s předvolbou i bez. Číslo bez předvolby je české (+420).
- Číslo se ukládá v jednotném tvaru E.164, například `+420777123456`. Podle něj se vyhledává, porovnává a počítají se nepřijetí.
- Stejná normalizace platí na serveru i v prohlížeči. Rozhoduje server.
- Na jedno číslo lze mít ve stejném slotu nejvýše jednu rezervaci. Kdo potřebuje víc stolů, zavolá.
