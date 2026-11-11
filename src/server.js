// Vstupní bod aplikace: konfigurace, časové pásmo, databáze a spuštění HTTP serveru.
import { createServer } from 'node:http';
import config from './config.js';
import { createApp } from './app.js';
import { openDatabase } from './db/database.js';
import { createReservationsRepository } from './db/reservations-repository.js';
import { createReservationService } from './services/reservation-service.js';

// Všechna data a časy v aplikaci jsou v pražském čase
process.env.TZ = config.timezone;

const db = openDatabase();
const reservationService = createReservationService({
  repository: createReservationsRepository(db),
  openingHours: config.openingHours,
  capacityPerSlot: config.reservations.capacityPerSlot,
  daysAhead: config.reservations.daysAhead
});

const server = createServer(createApp({ reservationService }));
const { host, port } = config.server;

server.listen(port, host, () => {
  console.log(`${config.cafe.name} běží na http://${host}:${port}`);
  console.log(`Administrace: http://${host}:${port}/admin`);
});

function shutdown() {
  server.close();
  db.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
