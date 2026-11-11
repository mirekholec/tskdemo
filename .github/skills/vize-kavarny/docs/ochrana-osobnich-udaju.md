# Ochrana osobních údajů

## Z6 · Osobní údaje jen na nezbytnou dobu

Kavárna potřebuje údaje hostů jen k tomu, aby rezervace fungovala. Méně dat znamená menší riziko.

## Pro implementaci

- U rezervace ukládáme jméno, telefon, e-mail, počet osob, poznámku, jazyk a stav. Nic dalšího.
- Rezervace starší 12 měsíců se anonymizují: zmizí jméno, telefon, e-mail a poznámka. Zůstane datum, čas, počet osob a stav pro statistiky.
- Historie a vyhledávání v administraci proto sahají nejvýše 12 měsíců zpět.
- Export pro účetní obsahuje datum, čas, jméno, počet osob a stav. Telefon ani e-mail ne.
- E-mail hosta slouží jen k potvrzení, připomínce a zrušení rezervace.
