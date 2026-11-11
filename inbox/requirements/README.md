# Požadavky

Neutříděné požadavky od majitelky, personálu, externistů a hostů. Slouží jako vstup pro agenty v [.github/agents](../../.github/agents), kteří z nich vytvoří zadání v [tasks](../../tasks).

## Přehled pro lektora

Typ a doporučený agent jsou jen orientační. Rozhodnout, o co jde, je součástí dema.

| # | Požadavek | Od | Typ | Agent |
|---|---|---|---|---|
| 01 | [Úprava ceníku](01-email-jana-cenik.md) | Jana, majitelka | malá úprava | Task |
| 02 | [Rezervace po telefonu](../todoist/02-slack-tomas-telefonicke-rezervace.md) | Tomáš, provozní | administrace | Task |
| 03 | [Rozpor 1 hodina vs. 15 minut](03-recenze-host-15-minut.md) | host, Google recenze | malá úprava | Task nebo Bug |
| 04 | [Lidé nechodí na rezervace](04-email-jana-lide-nechodi.md) | Jana, majitelka | komplexní | Dekompozice |
| 05 | [Rezervace nefunguje](05-email-host-telefon.md) | host, e-mail | chyba | Bug |
| 06 | [Podklady k uzávěrce](06-email-lucie-export.md) | Lucie, účetní | administrace | Task |
| 07 | [Otevírací doba a svátky](07-whatsapp-jana-svatky-vikendy.md) | Jana, majitelka | rezervace | Task nebo Dekompozice |
| 08 | [Drobnosti na web](08-chat-petra-socialni-site.md) | Petra, marketing | malá úprava | Task |
| 09 | [Anglická verze webu](09-porada-anglicka-verze.md) | porada | komplexní | Dekompozice |
| 10 | [Podezřelé rezervace](../todoist/10-slack-kuba-stejne-cislo.md) | Kuba, barista | rezervace | Task |
| 11 | [Všechno obsazeno?](../todoist/11-slack-jana-vse-obsazeno.md) | Jana, majitelka | chyba | Bug |
| 12 | [Kolik lidí přijde?](12-email-jana-pocet-osob.md) | Jana, majitelka | rezervace | Task |
| 13 | [Admin na tabletu](../todoist/13-slack-tomas-dnesni-rezervace.md) | Tomáš, provozní | malá úprava | Task |
| 14 | [Starší rezervace v adminu](../todoist/14-hlasovka-jana-historie-rezervaci.md) | Jana, majitelka | administrace | Task nebo Dekompozice |
| 15 | [Správa nabídky v adminu](15-email-tomas-sprava-nabidky.md) | Tomáš, provozní | komplexní | Dekompozice |

## Na co se dá v demu upozornit

- **05 a 11** jsou skutečné chyby v aplikaci. Telefon s pomlčkami neprojde validací a už začaté časy se ukazují jako „obsazeno“.
- **01 a 15** se překrývají. Ruční změna ceníku teď, správa nabídky v adminu později.
- **02** obsahuje protichůdné požadavky (nepřekročit kapacitu × občas někoho „nacpat“), které je potřeba vyjasnit.
- **10** skrývá okrajový případ: stejné číslo zapsané s předvolbou a bez ní.
- **12** nechává otevřené, jestli se kapacita počítá na stoly, nebo na osoby.
- **14** potřebuje minulé rezervace, které administrace zatím vůbec nezobrazuje.
