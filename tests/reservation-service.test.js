import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { openDatabase } from '../src/db/database.js';
import { createReservationsRepository } from '../src/db/reservations-repository.js';
import {
  SlotFullError,
  ValidationError,
  createReservationService
} from '../src/services/reservation-service.js';

// Pevný „teď“: čtvrtek 5. 11. 2026 14:30 místního času
const NOW = new Date(2026, 10, 5, 14, 30);
const TODAY = '2026-11-05';
const TOMORROW = '2026-11-06';

const VALID_INPUT = { date: TOMORROW, hour: 13, name: 'Jana Nováková', phone: '+420 777 111 222' };

let service;

beforeEach(() => {
  service = createReservationService({
    repository: createReservationsRepository(openDatabase(':memory:')),
    openingHours: { open: 13, close: 20 },
    capacityPerSlot: 5,
    daysAhead: 14
  });
});

function assertValidationError(fn, field) {
  assert.throws(fn, (error) => {
    assert.ok(error instanceof ValidationError, `čekána ValidationError, přišlo ${error.name}`);
    assert.ok(error.fields[field], `čekána chyba u pole "${field}", přišlo ${JSON.stringify(error.fields)}`);
    return true;
  });
}

describe('sloty', () => {
  it('generuje 7 hodinových slotů 13:00–19:00', () => {
    const { slots } = service.getSlots(TOMORROW, NOW);
    assert.deepEqual(slots.map((slot) => slot.time), ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']);
    assert.ok(slots.every((slot) => slot.available === 5 && slot.bookable));
  });

  it('dnes nabízí jen sloty, které ještě nezačaly', () => {
    const { slots } = service.getSlots(TODAY, NOW);
    const bookable = slots.filter((slot) => slot.bookable).map((slot) => slot.hour);
    assert.deepEqual(bookable, [15, 16, 17, 18, 19]);
  });

  it('ukazuje počet volných míst a plný slot jako nerezervovatelný', () => {
    for (let i = 0; i < 5; i++) {
      service.createReservation({ ...VALID_INPUT, hour: 14 }, NOW);
    }
    service.createReservation({ ...VALID_INPUT, hour: 15 }, NOW);

    const { slots } = service.getSlots(TOMORROW, NOW);
    assert.deepEqual(slots.find((slot) => slot.hour === 14), { hour: 14, time: '14:00', available: 0, bookable: false });
    assert.equal(slots.find((slot) => slot.hour === 15).available, 4);
  });

  it('odmítne den mimo povolený rozsah', () => {
    assertValidationError(() => service.getSlots('2026-11-04', NOW), 'date');
    assertValidationError(() => service.getSlots('2026-11-19', NOW), 'date');
    assertValidationError(() => service.getSlots('nesmysl', NOW), 'date');
  });
});

describe('dostupné dny', () => {
  it('nabízí 14 dní od dneška, první je „Dnes“', () => {
    const days = service.getAvailableDays(NOW);
    assert.equal(days.length, 14);
    assert.deepEqual(days[0], { date: TODAY, weekday: 'Dnes', dayMonth: '5. 11.' });
    assert.equal(days[1].weekday, 'Pá');
    assert.equal(days.at(-1).date, '2026-11-18');
  });

  it('vynechá dnešek, když už začal poslední slot', () => {
    const days = service.getAvailableDays(new Date(2026, 10, 5, 19, 5));
    assert.equal(days.length, 13);
    assert.equal(days[0].date, TOMORROW);
  });
});

describe('vytvoření rezervace', () => {
  it('uloží rezervaci a vrátí shrnutí', () => {
    const reservation = service.createReservation(VALID_INPUT, NOW);
    assert.equal(reservation.time, '13:00');
    assert.equal(reservation.dateLabel, 'pátek 6. 11.');
    assert.equal(reservation.phone, '+420777111222');
    assert.ok(reservation.id > 0);
  });

  it('přijme hodinu i jako text z formuláře', () => {
    assert.equal(service.createReservation({ ...VALID_INPUT, hour: '16' }, NOW).time, '16:00');
  });

  it('odmítne šestou rezervaci ve stejném slotu', () => {
    for (let i = 0; i < 5; i++) {
      service.createReservation(VALID_INPUT, NOW);
    }
    assert.throws(() => service.createReservation(VALID_INPUT, NOW), SlotFullError);
  });

  it('odmítne slot, který už začal nebo proběhl', () => {
    assertValidationError(() => service.createReservation({ ...VALID_INPUT, date: TODAY, hour: 14 }, NOW), 'hour');
    assertValidationError(() => service.createReservation({ ...VALID_INPUT, date: TODAY, hour: 13 }, NOW), 'hour');
  });

  it('odmítne den mimo rozsah', () => {
    assertValidationError(() => service.createReservation({ ...VALID_INPUT, date: '2026-11-04' }, NOW), 'date');
    assertValidationError(() => service.createReservation({ ...VALID_INPUT, date: '2026-11-19' }, NOW), 'date');
    assertValidationError(() => service.createReservation({ ...VALID_INPUT, date: '2026-02-30' }, NOW), 'date');
  });

  it('odmítne hodinu mimo otevírací dobu', () => {
    assertValidationError(() => service.createReservation({ ...VALID_INPUT, hour: 12 }, NOW), 'hour');
    assertValidationError(() => service.createReservation({ ...VALID_INPUT, hour: 20 }, NOW), 'hour');
    assertValidationError(() => service.createReservation({ ...VALID_INPUT, hour: 13.5 }, NOW), 'hour');
    assertValidationError(() => service.createReservation({ ...VALID_INPUT, hour: '' }, NOW), 'hour');
  });

  it('validuje jméno (2–80 znaků po ořezání mezer)', () => {
    assertValidationError(() => service.createReservation({ ...VALID_INPUT, name: ' J ' }, NOW), 'name');
    assertValidationError(() => service.createReservation({ ...VALID_INPUT, name: 'x'.repeat(81) }, NOW), 'name');
    assert.equal(service.createReservation({ ...VALID_INPUT, name: '  Jo  ' }, NOW).name, 'Jo');
  });

  it('validuje telefon a ukládá ho bez mezer', () => {
    assertValidationError(() => service.createReservation({ ...VALID_INPUT, phone: 'abc' }, NOW), 'phone');
    assertValidationError(() => service.createReservation({ ...VALID_INPUT, phone: '12345' }, NOW), 'phone');
    assertValidationError(() => service.createReservation({ ...VALID_INPUT, phone: '+420-777-111-222' }, NOW), 'phone');
    assert.equal(service.createReservation({ ...VALID_INPUT, phone: '777 111 222' }, NOW).phone, '777111222');
  });

  it('vrátí všechny chyby najednou', () => {
    assert.throws(
      () => service.createReservation({}, NOW),
      (error) => {
        assert.deepEqual(Object.keys(error.fields).sort(), ['date', 'hour', 'name', 'phone']);
        return true;
      }
    );
  });
});

describe('seznam a mazání', () => {
  it('vypíše rezervace od dneška seřazené podle data a času', () => {
    service.createReservation({ ...VALID_INPUT, date: '2026-11-07', hour: 13 }, NOW);
    service.createReservation({ ...VALID_INPUT, hour: 18 }, NOW);
    service.createReservation({ ...VALID_INPUT, hour: 13 }, NOW);

    const list = service.listUpcoming(NOW);
    assert.deepEqual(list.map((r) => `${r.date} ${r.time}`), [
      '2026-11-06 13:00',
      '2026-11-06 18:00',
      '2026-11-07 13:00'
    ]);
  });

  it('nevypíše rezervace z minulých dnů', () => {
    service.createReservation(VALID_INPUT, NOW);
    assert.equal(service.listUpcoming(new Date(2026, 10, 7, 10, 0)).length, 0);
  });

  it('smaže rezervaci a uvolní místo ve slotu', () => {
    const { id } = service.createReservation(VALID_INPUT, NOW);

    assert.equal(service.deleteReservation(id), true);
    assert.equal(service.listUpcoming(NOW).length, 0);
    assert.equal(service.getSlots(TOMORROW, NOW).slots[0].available, 5);
  });

  it('vrátí false pro neexistující nebo neplatné id', () => {
    assert.equal(service.deleteReservation(999), false);
    assert.equal(service.deleteReservation('abc'), false);
    assert.equal(service.deleteReservation(-1), false);
  });
});
