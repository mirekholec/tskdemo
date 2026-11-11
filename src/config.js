// Veškerá konfigurace aplikace. Relativní cesty se počítají od kořene projektu.
export default {
  server: { host: 'localhost', port: 3004 },

  // Časové pásmo pro všechna data a časy (rezervace, „dnes“, datum vytvoření)
  timezone: 'Europe/Prague',

  // Údaje o kavárně jsou fiktivní a do šablon se dostávají jako {{ cafe.* }}
  cafe: {
    name: 'Kavárna Holubník',
    tagline: 'Výběrová káva a domácí pečivo na Vinohradech',
    street: 'Holubí 12',
    city: '120 00 Praha 2 – Vinohrady',
    phone: '+420 777 123 456',
    email: 'ahoj@kavarnaholubnik.cz',
    instagram: 'https://instagram.com/kavarnaholubnik'
  },

  // Otevírací doba v celých hodinách (open včetně, close vyjma)
  openingHours: { open: 13, close: 20 },

  reservations: { capacityPerSlot: 5, daysAhead: 14 },

  // Heslo v plain textu je pro demo záměrné zjednodušení (viz backlog v docs/PLAN.md)
  admin: { password: 'holubnik2026', sessionTtlMinutes: 120 },

  database: { file: 'data/kavarna.sqlite' }
};
