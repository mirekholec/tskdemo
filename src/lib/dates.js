// Práce s daty a české formátování. Vše pracuje v lokálním čase procesu,
// který server.js nastaví na config.timezone (Europe/Prague).

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

// Formátovač se vytváří až při volání, protože Intl si časové pásmo zafixuje při vytvoření
// a modul se může načíst dřív, než server.js nastaví process.env.TZ.
function format(date, options) {
  return new Intl.DateTimeFormat('cs-CZ', options).format(date);
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

// Date → "2026-11-05"
export function toIsoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// "2026-11-05" → Date o půlnoci, nebo null pro neplatné datum (např. 2026-02-30)
export function parseIsoDate(text) {
  const match = ISO_DATE_PATTERN.exec(String(text ?? ''));
  if (!match) {
    return null;
  }

  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return toIsoDate(date) === text ? date : null;
}

// Rozdíl v celých kalendářních dnech (odolné vůči přechodu na letní čas)
export function daysBetween(from, to) {
  const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toUtc - fromUtc) / 86_400_000);
}

// 13 → "13:00"
export function formatTime(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

// "středa 5. 11."
export function formatDayLabel(date) {
  return `${format(date, { weekday: 'long' })} ${formatDayMonth(date)}`;
}

// "Pá" (zkratka dne s velkým písmenem)
export function formatWeekdayShort(date) {
  return capitalize(format(date, { weekday: 'short' }));
}

// "5. 11."
export function formatDayMonth(date) {
  return format(date, { day: 'numeric', month: 'numeric' });
}

// "čt 5. 11. 2026"
export function formatFullDate(date) {
  return format(date, { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' });
}

// "30. 10. 2026 9:54"
export function formatDateTime(date) {
  return format(date, { day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// SQLite "2026-10-30 09:54:12" (lokální čas) → Date
export function parseSqlDateTime(text) {
  const [datePart, timePart = '00:00:00'] = String(text).split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes, seconds] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds);
}
