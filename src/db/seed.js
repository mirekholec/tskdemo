// Naplní databázi ukázkovými rezervacemi na nejbližší dny (npm run db:seed).
// Stávající rezervace se nejprve smažou, aby šlo seed spouštět opakovaně.
import config from '../config.js';
import { addDays, startOfDay, toIsoDate } from '../lib/dates.js';
import { openDatabase } from './database.js';
import { createReservationsRepository } from './reservations-repository.js';

process.env.TZ = config.timezone;

const GUESTS = [
  ['Jana Nováková', '+420777111222'],
  ['Petr Svoboda', '+420602345678'],
  ['Lucie Dvořáková', '+420731456789'],
  ['Tomáš Černý', '+420608112233'],
  ['Kateřina Procházková', '+420775998877'],
  ['Martin Kučera', '+420721334455'],
  ['Eva Veselá', '+420739667788'],
  ['Jakub Horák', '+420604221100'],
  ['Tereza Němcová', '+420776543210'],
  ['Ondřej Marek', '+420733889900'],
  ['Barbora Pokorná', '+420605776655'],
  ['David Pospíšil', '+420728123987'],
  ['Anna Hájková', '+420774020304'],
  ['Filip Král', '+420607303132'],
  ['Klára Jelínková', '+420736404142']
];

// [posun dnů od dneška, hodina, počet rezervací]
const PLAN = [
  [1, 13, 1],
  [1, 15, 2],
  [1, 17, 5], // plně obsazený slot pro ukázku stavu „obsazeno“
  [2, 14, 2],
  [2, 18, 3],
  [3, 16, 2],
  [4, 13, 1],
  [5, 19, 2],
  [6, 15, 2]
];

const db = openDatabase();
const repository = createReservationsRepository(db);
const today = startOfDay(new Date());

let guestIndex = 0;
let inserted = 0;

const deleted = repository.transaction(() => {
  const removed = repository.deleteAll();

  for (const [dayOffset, hour, count] of PLAN) {
    const date = toIsoDate(addDays(today, dayOffset));
    for (let i = 0; i < count; i++) {
      const [name, phone] = GUESTS[guestIndex++ % GUESTS.length];
      repository.insert({ date, hour, name, phone });
      inserted++;
    }
  }

  return removed;
});

db.close();
console.log(`Seed hotov: smazáno ${deleted}, vloženo ${inserted} ukázkových rezervací.`);
