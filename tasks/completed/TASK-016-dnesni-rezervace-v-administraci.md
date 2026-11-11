---
id: TASK-016
todoist-id: 6hwVHXgJ3xcxhgm4
name: Dnešní rezervace v administraci
status: completed
---

V seznamu rezervací v administraci zvýraznit dnešní rezervace a ty, které už dnes proběhly, zobrazit tlumeně.

## Požadavky

- Zdroj požadavku: Todoist task „tomas-dnesni-rezervace (13)“ (Tomáš Krejčí, admin na tabletu u baru) a komentář „dnešní rezervace zvýrazníme a ta proběhlé zobrazíme nějak tlumeně“.
- Dnešní rezervace jsou barevně odlišené, aby je personál poznal bez čtení data.
- Dnešní rezervace, které už proběhly, jsou zobrazeny tlumeně (šedě), ne skryté.
- Zbytek seznamu, mazání a řazení se nemění.

## Technické poznámky

- Rezervace trvá celou hodinu, proběhlá je od konce hodinového slotu (`hodina < aktuální hodina`).
- Šablony nemají podmínky, třídu řádku a štítek „Dnes“ předává handler; prázdný štítek skrývá CSS.

## Implementační plán

1. `listUpcoming` doplní každé rezervaci stav `today` / `past` / `upcoming`.
2. Handler `/admin` převede stav na třídu řádku a štítek.
3. Styly v `admin.css` pro zvýraznění a ztlumení.
4. Test stavů a aktualizace `docs/administrace.md`.

## Akceptační kritéria

- Dnešní nadcházející rezervace mají barevné pozadí a štítek „Dnes“.
- Dnešní proběhlé rezervace jsou ztlumené.
- Rezervace dalších dnů vypadají beze změny.
- `npm test` projde.
