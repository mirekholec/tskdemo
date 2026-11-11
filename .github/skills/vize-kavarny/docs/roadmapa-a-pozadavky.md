# Roadmapa a dopad na požadavky

Požadavky od personálu, hostů a externistů jsou seřazené do fází podle vize. Pořadí fází je závazné, pořadí uvnitř fáze určí správce webu podle náročnosti.

## Fáze 0 · Opravy a rychlé výhry

**Do 20. 11. 2026**

Chyby, které odhánějí hosty, a drobnosti s okamžitou hodnotou. Žádná z nich nemění datový model.

- 01 ceník
- 03 15 minut
- 05 telefon
- 08 drobnosti
- 10 stejné číslo
- 11 obsazeno
- 13 tablet

## Fáze 1 · Vánoční sezóna

**Do 15. 12. 2026**

Otevírací doba a svátky nejpozději do 1. 12. Pak počet osob a kapacita v místech, telefonické rezervace a první část opatření proti no-show.

- 07 do 1. 12.
- 12 počet osob
- 02 telefonické
- 04A potvrzení a zrušení

## Fáze 2 · Leden a únor 2027

**Do 28. 2. 2027**

Druhá část opatření proti no-show, historie rezervací s anonymizací, export pro účetní a správa nabídky včetně kategorie Brunch. Do té doby se brunchové menu doplní ručně jako statické HTML.

- 04B připomínky a no-show
- 14 historie
- 06 export
- 15 nabídka

## Fáze 3 · Turistická sezóna

**Do 15. 3. 2027**

Anglická verze webu a rezervace. Navazuje na správu nabídky, protože položky menu potřebují anglické texty v databázi.

- 09 anglická verze

## Dopad vize na požadavky

| # | Požadavek | Fáze | Zásady | Co z vize plyne pro implementaci |
|---|---|---|---|---|
| 01 | Úprava ceníku | 0 | Z8 | Ruční úprava ve fragmentu nabídky. Nestavět vlastní správu cen, tu přinese #15. |
| 02 | Rezervace po telefonu | 1 | Z3 Z4 Z5 | Přidání a přesun v administraci, společná kapacita 18 míst. Překročení jen vědomě s označením „nad kapacitu“. E-mail nepovinný. |
| 03 | Rozpor 1 hodina × 15 minut | 0 | Z1 | Platí rezervace na hodinu a držení stolu 15 minut. Hodnota z konfigurace, texty z jednoho zdroje. |
| 04 | Lidé nechodí na rezervace | 1 + 2 | Z2 Z4 Z6 Z8 | E-mail, ne SMS. Rozdělit na 04A (stavy, potvrzení, zrušení hostem) a 04B (připomínka, evidence nepřijetí, blokace 2× za 6 měsíců, měsíční přehled). |
| 05 | Rezervace nefunguje | 0 | Z4 | Přijmout běžné zápisy čísla včetně pomlček a normalizovat na E.164. Stejná logika na serveru i v prohlížeči. |
| 06 | Podklady k uzávěrce | 2 | Z5 Z6 | CSV pro Excel (UTF-8 s BOM, středník) za zvolený měsíc, bez telefonu a e-mailu. Vlastní heslo účetní jen pro export. |
| 07 | Otevírací doba a svátky | 1 | Z1 Z8 | Otevírací doba podle dne v týdnu s datem platnosti a výjimky v jednom zdroji, zobrazené na webu i v rezervaci. 30 dní dopředu. Hotovo do 1. 12. 2026. |
| 08 | Drobnosti na web | 0 | Z1 Z8 | Facebook v konfiguraci vedle Instagramu. Tlačítko Navigovat vede na Google Maps s adresou z konfigurace. |
| 09 | Anglická verze webu | 3 | Z7 Z8 | Texty v souborech podle jazyka, adresy `/en/`, jazyk uložený u rezervace, e-maily v jazyce hosta. Navazuje na #15. |
| 10 | Podezřelé rezervace | 0 | Z4 | Nejvýše 1 rezervace na normalizované číslo a slot. `+420 777 222 333` a `777222333` je stejné číslo. |
| 11 | Všechno obsazeno? | 0 | Z1 | Začatý slot není obsazený. API vrací důvod nedostupnosti, prohlížeč ho zobrazí odlišně, nebo slot skryje. |
| 12 | Kolik lidí přijde? | 1 | Z3 Z6 | 1–6 osob, poznámka do 200 znaků, kapacita 18 míst na slot. Obojí vidět v administraci. |
| 13 | Admin na tabletu | 0 | Z5 | Dnešek zvýraznit, proběhlé rezervace šedě. Ovládání prstem. |
| 14 | Starší rezervace v adminu | 2 | Z4 Z5 Z6 | Hledání podle jména a normalizovaného telefonu, filtr od–do, stránkování. Nejvýše 12 měsíců zpět. |
| 15 | Správa nabídky v adminu | 2 | Z5 Z7 Z8 | Položky v databázi včetně anglických textů, kategorie včetně Brunch, „došlo“ do konce dne, sezónní platnost od–do, pořadí. Fotky později. |

## Závislosti mezi požadavky

- 05 a 10 před 04B a 14: evidence nepřijetí i vyhledávání stojí na normalizovaném telefonu.
- 12 před 02: telefonické rezervace už počítají s osobami a kapacitou v místech.
- 07 před Vánocemi: 30 dní dopředu bez svátků by nabízelo rezervace na zavřené dny.
- 15 před 09: anglická nabídka potřebuje položky v databázi.
