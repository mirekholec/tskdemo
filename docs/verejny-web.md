---
created: "2026-11-06"
updated: "2026-11-06 13:08"
lastChange: "Vytvořen popis původu údajů na veřejném webu, textů o rezervaci a požadavků na přístupnost."
tags:
  - aplikace
  - verejny-web
---

# Veřejný web

One-page prezentace kavárny a stránka rezervace sdílejí layout i údaje z konfigurace. Pro údržbu je podstatné, které údaje jdou z konfigurace a které jsou v HTML natvrdo. Důležité je také, že texty o pravidlech rezervace nejsou svázané s logikou služby. Výčet sekcí je zřejmý z `src/views/pages/home.html`, proto ho dokument neopakuje.

## Pravidla a záměr

- **Kontakty a otevírací doba jdou z konfigurace.** Název, tagline, adresa, telefon, e-mail, adresa Instagramu a otevírací doba se do šablon dostávají jako globální proměnné `cafe.*` a `openingHours.*`. Změna v `src/config.js` se proto projeví najednou v úvodu, v sekci Návštěva, v patičce i na stránce rezervace (PDF s. 3 „Odkud se berou údaje“; `src/lib/template.js` `appGlobals()`, ř. 111–123; např. `src/views/sections/hero.html:4`, `src/views/sections/visit.html:10`, `src/views/partials/footer.html:11`, `src/views/pages/reservation.html:72`). Výjimky uvádí sekce Rozpory.
- Odkazy `tel:` mají používat globální `cafe.phoneHref`, tedy telefon bez mezer (`src/lib/template.js:116–117`).
- **Nabídka a ceny jsou statické HTML** ve fragmentu `src/views/sections/menu.html`. Každou změnu ceníku dělá správce webu v kódu (PDF s. 3).
- **Texty o pravidlech rezervace jsou psané ručně** v několika fragmentech. Z konfigurace se bere jen počet dní dopředu (`daysAhead`) a otevírací doba. Délka slotu, kapacita ani doba, po kterou se stůl drží, se do textů nepropisují (PDF s. 3; `src/routes/pages.js:32`; `src/views/pages/reservation.html:64–67`; `src/views/sections/reservation-cta.html:5`).
- Navigace vede na kotvy ve tvaru `/#sekce`, aby fungovala i ze stránky rezervace (PDF s. 3, kap. 2; `src/views/partials/header.html:18–21`).

## Rozhodnutí a omezení

- **„Denně“ je natvrdo.** Úvod, sekce Návštěva, patička i stránka rezervace píšou „denně“ nebo „Otevřeno denně“. To odpovídá pravidlu jedné otevírací doby pro všechny dny, viz [rezervace.md](rezervace.md). Víkendová otevírací doba nebo zavírací dny by proto vyžadovaly změnu konfigurace, služby i těchto textů (`src/views/sections/hero.html:4`, `src/views/sections/visit.html:10`, `src/views/partials/footer.html:11`, `src/views/pages/reservation.html:71`).
- Šablony vypisují otevírací dobu jako `{{ openingHours.open }}:00`, předpokládají tedy celé hodiny. To odpovídá konfiguraci, kde `open` platí včetně a `close` vyjma (`src/config.js:19–20`).
- **Bez externích zdrojů.** Písma Fraunces a Inter jsou hostovaná lokálně pod licencí SIL OFL a web nepotřebuje žádné CDN (PDF s. 4 „Design a přístupnost“). V šablonách ani v CSS není jiná externí adresa než odkaz na Instagram.
- **Přístupnost je požadavek:** sémantické HTML, `alt` u fotek, `label` u polí, viditelný fokus, ovládání klávesnicí a respektování `prefers-reduced-motion` (PDF s. 4). Na omezení animací navazuje i kód pro prohlížeč: potvrzení rezervace se posouvá s `behavior: 'auto'`, aby převzalo pravidlo z CSS (`src/assets/css/styles.css:36`; `src/assets/js/reservation.js:158–159`).
- **Fotky jsou generované AI** v jednotném stylu: teplé světlo, dokumentární fotografie, žádný text v obraze. Důvodem je realistický vzhled bez licenčních omezení (PDF s. 4, s. 11 „Zásadní technická rozhodnutí“). Pro nové fotky je tento popis jedinou specifikací.

## Rozpory a otevřené otázky

- **Texty o držení stolu si odporují.**
  - Úvod stránky rezervace slibuje, že stůl „podržíme celou hodinu“ (`src/views/pages/reservation.html:5`).
  - Pás na úvodní stránce nabízí rezervaci „na celou hodinu“ (`src/views/sections/reservation-cta.html:5`).
  - Postranní panel na stránce rezervace uvádí, že stůl držíme 15 minut od začátku rezervace (`src/views/pages/reservation.html:66`).

  PDF říká, že platí 15 minut, a odkazuje přitom na část III. Texty v kódu opravené nejsou (PDF s. 4 „Texty o rezervaci si odporují“, s. 11 „Funkční omezení aktuální verze“, řádek Obsah). Pravidlo 15 minut nemá v aplikaci žádnou logiku, viz [rezervace.md](rezervace.md).
- **Ne všechny údaje jdou z konfigurace.** Podle PDF nejsou otevírací doba ani Instagram v HTML natvrdo. Neplatí to úplně:
  - meta popis úvodní stránky obsahuje pevný text „Otevřeno denně 13–20 h.“ (`src/routes/pages.js:14`);
  - viditelný text odkazu „Instagram @kavarnaholubnik“ je v patičce natvrdo, z konfigurace jde jen adresa odkazu (`src/views/partials/footer.html:26`).

  Na těchto místech se změna konfigurace neprojeví.

## Zdroje

- [docs/kavarna-holubnik.pdf](../kavarna-holubnik.pdf): s. 3–4, kap. 2 Veřejný web („Odkud se berou údaje“, „Texty o rezervaci si odporují“, „Design a přístupnost“); s. 11, kap. 7 „Zásadní technická rozhodnutí“ (fotky); s. 11, kap. 8 „Funkční omezení aktuální verze“ (Obsah).
- Kód: [src/lib/template.js](../../src/lib/template.js), [src/routes/pages.js](../../src/routes/pages.js), [src/config.js](../../src/config.js), [src/views/pages/reservation.html](../../src/views/pages/reservation.html), [src/views/sections/reservation-cta.html](../../src/views/sections/reservation-cta.html), [src/views/sections/hero.html](../../src/views/sections/hero.html), [src/views/sections/visit.html](../../src/views/sections/visit.html), [src/views/partials/footer.html](../../src/views/partials/footer.html), [src/views/partials/header.html](../../src/views/partials/header.html), [src/assets/css/styles.css](../../src/assets/css/styles.css), [src/assets/js/reservation.js](../../src/assets/js/reservation.js).
