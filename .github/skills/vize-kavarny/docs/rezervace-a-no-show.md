# Rezervace a no-show

## Z2 · Rezervace je závazek obou stran

Kavárna stůl drží, host dá vědět, když nepřijde. Opakované nepřijetí má důsledky, ale rozhoduje o nich personál, ne automat bez možnosti výjimky.

## Pro implementaci

- Po online rezervaci přijde potvrzení e-mailem s odkazem na zrušení. Den předem v 10:00 přijde připomínka.
- E-mail, ne SMS. E-mail je zdarma a stačí. SMS je možné rozšíření později.
- E-mail je povinný údaj online rezervace. Telefonická rezervace zapsaná personálem ho nevyžaduje.
- Host může rezervaci zrušit sám nejpozději 1 hodinu před začátkem. Zrušení uvolní místo.
- Rezervace má stav: `potvrzená`, `zrušená hostem`, `dorazil`, `nepřišel`. Mazání zůstává jen pro omyly a podvržené rezervace.
- Kdo za posledních 6 měsíců dvakrát nepřišel, nemůže rezervovat online, jen po telefonu. Personál ho může v administraci odblokovat.
