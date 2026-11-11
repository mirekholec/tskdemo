# Kapacita a počet osob

## Z3 · Počítáme místa, ne stoly

Kavárna potřebuje vědět, kolik lidí přijde. Konkrétní stůl ale přiřazuje personál na místě, aplikace stoly neeviduje.

## Pro implementaci

- Kapacita slotu je 18 míst a platí pro online i telefonické rezervace dohromady. Druhá polovina kavárny se nerezervuje.
- Rezervace je pro 1–6 osob. Větší skupinu web odkáže na telefon.
- K rezervaci lze připsat poznámku do 200 znaků (kočárek, pes, narozeniny, dětská židlička). Personál ji vidí v administraci.
- Web kapacitu nikdy nepřekročí. Personál ji v administraci může vědomě překročit (štamgast), aplikace si to vyžádá potvrdit a rezervaci označí „nad kapacitu“.
- Stávající rezervace bez počtu osob se počítají jako 2 osoby.
