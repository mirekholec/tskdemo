# Kavárna Holubník

Ukázková webová aplikace fiktivní kavárny na pražských Vinohradech pro školení task managementu. Je záměrně jednoduchá, rozdělená do více souborů a nechává prostor pro další vylepšení.

- **Veřejný web:** one-page prezentace kavárny (O nás, Nabídka, Atmosféra, Návštěva).
- **Rezervace** (`/rezervace`): výběr dne a volného hodinového času 13:00–19:00, stačí jméno a telefon. Na jeden čas lze přijmout nejvýše 5 rezervací.
- **Administrace** (`/admin`): přihlášení heslem, seznam nadcházejících rezervací a jejich mazání.

## Požadavky

- Node.js **22.13 nebo novější** (doporučeno Node 24 LTS). Používá vestavěný modul `node:sqlite`.
- Nic dalšího. Aplikace nemá žádné npm závislosti, `npm install` není potřeba.

## Spuštění

```bash
./run.sh
```

Skript spustí server a otevře web v prohlížeči. Pokud už aplikace běží, jen otevře prohlížeč. Server ukončíte klávesami Ctrl+C.

Bez otevření prohlížeče lze server spustit přímo:

```bash
npm start
```

Web běží na <http://localhost:3004>. Databáze `data/kavarna.sqlite` se vytvoří automaticky při prvním startu.

Volitelně můžete databázi naplnit ukázkovými rezervacemi (stávající rezervace se smažou):

```bash
npm run db:seed
```

## Administrace

Adresa: <http://localhost:3004/admin>, heslo: **`holubnik2026`**.

Heslo i ostatní nastavení (adresa a kontakty kavárny, otevírací doba, kapacita, port) jsou v [src/config.js](src/config.js). Heslo v konfiguraci je pro demo záměrné zjednodušení.

## Skripty

| Příkaz | Popis |
|---|---|
| `./run.sh` | Spustí server a otevře web v prohlížeči. |
| `npm start` | Spustí server. |
| `npm run dev` | Spustí server a při změně souborů ho restartuje (`node --watch`). |
| `npm test` | Spustí testy přes vestavěný `node --test`. |
| `npm run db:seed` | Smaže rezervace a vloží zhruba 20 ukázkových. |

## Struktura projektu

```
├── data/                 # SQLite databáze (vzniká za běhu, není v gitu)
├── docs/                 # PRD a implementační plán
├── tests/                # testy šablonovacího enginu a rezervační služby
└── src/
    ├── config.js         # veškerá konfigurace včetně hesla
    ├── server.js         # start serveru (časové pásmo, databáze)
    ├── app.js            # zpracování požadavku: statické soubory → router → 404/500
    ├── lib/              # router, šablony, HTTP, statické soubory, session, data
    ├── db/               # schéma, připojení, repozitář (jediné místo s SQL), seed
    ├── services/         # byznys pravidla rezervací
    ├── routes/           # stránky, JSON API a administrace
    ├── views/            # HTML šablony: layouty, partials, sekce a stránky
    └── assets/           # CSS, JavaScript pro prohlížeč, písma a obrázky
```

## Jak se skládá HTML

Stránky skládá na serveru malý vlastní šablonovací engine ([src/lib/template.js](src/lib/template.js)). Header, footer i jednotlivé sekce jsou samostatné HTML fragmenty v `src/views`.

| Syntaxe | Význam |
|---|---|
| `{{> sections/hero }}` | Vloží fragment `src/views/sections/hero.html`. |
| `{{ cafe.name }}` | Vloží hodnotu a escapuje HTML. |
| `{{{ content }}}` | Vloží hodnotu bez escapování (jen HTML vyrobené serverem). |

Engine nemá podmínky ani cykly. Seznamy vyrenderuje handler po položkách přes `renderFragment()`.

## Poznámky

- Fotky jsou vygenerované AI, písma Fraunces a Inter jsou hostovaná lokálně pod licencí SIL OFL 1.1 (`src/assets/fonts/OFL-*.txt`).
- Zásadní technická rozhodnutí jsou v [DECISIONS.md](DECISIONS.md).
