# Zadání tvorby dokumentace aplikace

## Cíl a rozsah

Z části **Aplikace** v `docs/kavarna-holubnik.pdf` vytvoř stručnou dokumentaci pro vývojáře, který bude aplikaci udržovat nebo rozšiřovat. Zachovej především záměr, zdůvodnění rozhodnutí, netriviální pravidla, algoritmy a omezení, které nelze snadno pochopit přímým čtením kódu.

Části **Business plán** a **Vize** nezpracovávej. Nyní nevytvářej implementaci ani neměň zdrojový kód.

## Zdroje a ověření

- Vstupem je PDF; aktuální implementaci ověřuj v `src/`. Přihlédni také k `README.md` a existující dokumentaci v `docs/`, abys zbytečně neopakoval její obsah.
- Nejprve urči hranice části Aplikace a její tematické celky. Pokud zdroj chybí, je nečitelný nebo jsou hranice nejednoznačné, vyžádej si upřesnění před tvorbou dokumentů.
- PDF používej jako zdroj požadavků a záměru, kód jako doklad skutečné implementace. Rozpor mezi nimi nezamlčuj ani automaticky nerozhoduj ve prospěch jednoho zdroje.
- Rozlišuj **požadavek**, **ověřené současné chování** a **rozpor / otevřenou otázku**. Neimplementovaný požadavek z PDF nepopisuj jako hotovou funkci.
- Nevymýšlej důvody rozhodnutí ani chybějící pravidla. Pokud důležitá informace není doložená, označ ji jako otevřenou otázku.

## Co zachovat a co vynechat

Zachovej informace, které vysvětlují **proč** řešení existuje, jaká pravidla musí platit nebo jak spolu souvisejí části systému. Netriviální algoritmus popiš jen v rozsahu potřebném k pochopení jeho pravidel, okrajových případů a omezení; nepřepisuj implementaci.

Vynech prosté soupisy souborů, funkcí, rout, konfiguračních hodnot a přímočarý popis kódu. Samotná přítomnost pravidla v kódu ale není důvodem k jeho vynechání, pokud jeho význam či dopady vyžadují porozumění více částem systému.

U každého zachovaného tématu uveď zdroj: stránku PDF a název sekce; u tvrzení o implementaci také relativní cestu do `src/` a relevantní symbol nebo rozsah řádků. Odkazy mají umožnit kontrolu bez kopírování zdrojového kódu.

## Výstupní soubory

- Ukládej do `docs/aplikace/`, v češtině.
- Rozděluj podle ucelených témat z PDF, nikoli podle jednotlivých zdrojových souborů. Související drobná témata sluč; společná pravidla popiš jednou a z ostatních dokumentů na ně odkazuj.
- Názvy používej ve formátu `nazev-tematu.md`, malými písmeny, bez diakritiky, se spojovníky.
- Pokud po odfiltrování zjevných informací téma nemá hodnotný obsah, samostatný soubor nevytvářej.
- Existující dokumenty mimo `docs/aplikace/` neměň. Při aktualizaci cílových souborů zachovej nesouvisející obsah.

Každý cílový soubor začni YAML hlavičkou:

```yaml
---
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD HH:mm"
lastChange: "Jedna věta popisující poslední obsahovou změnu."
tags:
  - aplikace
  - nazev-tematu
---
```

Používej skutečný čas vytvoření či změny v časovém pásmu `Europe/Prague`. Při aktualizaci zachovej `created`; `updated` a `lastChange` měň při obsahové změně. Štítky sjednoť napříč dokumenty.

Za hlavičkou uveď název tématu a krátké shrnutí. Dále použij jen potřebné sekce: **Pravidla a záměr**, **Rozhodnutí a omezení**, **Netriviální postupy**, **Rozpory a otevřené otázky**, **Zdroje**. Piš krátké odstavce a odrážky; prázdné sekce vynech.

## Kritéria dokončení

- Každé podstatné téma části Aplikace je zachyceno, nebo je jeho vynechání odůvodněno tím, že je zjevné z kódu či již zdokumentované.
- Tvrzení jsou dohledatelná ve zdrojích; požadavky nejsou zaměněné za implementované chování.
- Výstupy neobsahují business plán, vizi, nepodložené závěry ani zbytečné duplicity.
- Soubory mají platnou YAML hlavičku a funkční relativní odkazy.

Na závěr vrať stručný seznam vytvořených či aktualizovaných souborů, významných vynechání a zjištěných rozporů nebo otázek. Nevytvářej další soubor s reportem.
