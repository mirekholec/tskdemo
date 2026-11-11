// Byznys pravidla rezervací: sloty, kapacita, rozsah dnů a validace.
// Parametr `now` umožňuje deterministické testy.
import {
  addDays,
  daysBetween,
  formatDayLabel,
  formatDayMonth,
  formatTime,
  formatWeekdayShort,
  parseIsoDate,
  startOfDay,
  toIsoDate
} from '../lib/dates.js';

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 80;
const PHONE_PATTERN = /^\+?\d{9,15}$/;
const HOUR_PATTERN = /^\d{1,2}$/;

export class ValidationError extends Error {
  constructor(fields) {
    super('Neplatné údaje rezervace.');
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

export class SlotFullError extends Error {
  constructor() {
    super('Tento čas je už obsazený, vyberte prosím jiný.');
    this.name = 'SlotFullError';
  }
}

// Hodina může přijít jako číslo (JSON) i jako text (formulář)
function parseHour(value) {
  if (typeof value === 'number') {
    return value;
  }
  return HOUR_PATTERN.test(String(value ?? '')) ? Number(value) : NaN;
}

export function createReservationService({ repository, openingHours, capacityPerSlot, daysAhead }) {
  // Sloty začínají v celou hodinu, poslední končí v okamžiku zavření
  const slotHours = Array.from(
    { length: openingHours.close - openingHours.open },
    (_, index) => openingHours.open + index
  );

  function hasSlotStarted(date, hour, now) {
    const slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour);
    return slotStart <= now;
  }

  // Vrátí Date, pokud den leží v povoleném rozsahu (dnes + daysAhead - 1), jinak null
  function parseBookableDate(text, now) {
    const date = parseIsoDate(text);
    if (!date) {
      return null;
    }
    const offset = daysBetween(now, date);
    return offset >= 0 && offset < daysAhead ? date : null;
  }

  function getAvailableDays(now) {
    const today = startOfDay(now);
    const days = [];

    for (let offset = 0; offset < daysAhead; offset++) {
      const date = addDays(today, offset);
      const isToday = offset === 0;

      // Dnešek nabízíme, jen pokud ještě nezačal poslední slot
      if (isToday && slotHours.every((hour) => hasSlotStarted(date, hour, now))) {
        continue;
      }

      days.push({
        date: toIsoDate(date),
        weekday: isToday ? 'Dnes' : formatWeekdayShort(date),
        dayMonth: formatDayMonth(date)
      });
    }

    return days;
  }

  function getSlots(dateText, now) {
    const date = parseBookableDate(dateText, now);
    if (!date) {
      throw new ValidationError({ date: 'Na tento den nelze rezervovat.' });
    }

    const counts = repository.countsByDate(dateText);

    return {
      date: dateText,
      slots: slotHours.map((hour) => {
        const available = Math.max(0, capacityPerSlot - (counts.get(hour) ?? 0));
        return {
          hour,
          time: formatTime(hour),
          available,
          bookable: available > 0 && !hasSlotStarted(date, hour, now)
        };
      })
    };
  }

  function validate(input, now) {
    const fields = {};
    const name = String(input.name ?? '').trim();
    const phone = String(input.phone ?? '').replace(/\s+/g, '');
    const dateText = String(input.date ?? '');
    const hour = parseHour(input.hour);

    const nameLength = [...name].length;
    if (nameLength < NAME_MIN_LENGTH || nameLength > NAME_MAX_LENGTH) {
      fields.name = `Zadejte jméno o délce ${NAME_MIN_LENGTH} až ${NAME_MAX_LENGTH} znaků.`;
    }

    if (!PHONE_PATTERN.test(phone)) {
      fields.phone = 'Zadejte platné telefonní číslo.';
    }

    const date = parseBookableDate(dateText, now);
    if (!date) {
      fields.date = dateText === '' ? 'Vyberte den rezervace.' : 'Na tento den nelze rezervovat.';
    }

    if (!slotHours.includes(hour)) {
      fields.hour = 'Vyberte čas rezervace.';
    } else if (date && hasSlotStarted(date, hour, now)) {
      fields.hour = 'Tento čas už nelze rezervovat.';
    }

    if (Object.keys(fields).length > 0) {
      throw new ValidationError(fields);
    }

    return { date, dateText, hour, name, phone };
  }

  function createReservation(input, now) {
    const { date, dateText, hour, name, phone } = validate(input ?? {}, now);

    // Kontrola kapacity a vložení musí proběhnout atomicky
    const id = repository.transaction(() => {
      if (repository.countBySlot(dateText, hour) >= capacityPerSlot) {
        throw new SlotFullError();
      }
      return repository.insert({ date: dateText, hour, name, phone });
    });

    return {
      id,
      date: dateText,
      hour,
      time: formatTime(hour),
      dateLabel: formatDayLabel(date),
      name,
      phone
    };
  }

  // Rezervace od dnešního dne (včetně dnešních), seřazené podle data a času
  // Každá rezervace dostane stav: 'today' (dnešní), 'past' (dnešní, jejíž hodinový slot už skončil)
  // nebo 'upcoming' (následující dny)
  function listUpcoming(now) {
    const todayIso = toIsoDate(now);
    return repository.listFrom(todayIso).map((reservation) => {
      let status = 'upcoming';
      if (reservation.date === todayIso) {
        status = reservation.hour < now.getHours() ? 'past' : 'today';
      }
      return { ...reservation, time: formatTime(reservation.hour), status };
    });
  }

  function deleteReservation(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return false;
    }
    return repository.deleteById(numericId);
  }

  return { getAvailableDays, getSlots, createReservation, listUpcoming, deleteReservation };
}
