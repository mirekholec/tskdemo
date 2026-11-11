// Rezervační formulář: načítání volných časů, validace a odeslání přes fetch.

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 80;
const PHONE_PATTERN = /^\+?\d{9,15}$/;

const form = document.getElementById('reservation-form');
const dayList = document.getElementById('day-list');
const slotList = document.getElementById('slot-list');
const slotsStatus = document.getElementById('slots-status');
const slotTemplate = document.getElementById('slot-template');
const submitButton = document.getElementById('submit-button');
const formMessage = document.getElementById('form-message');
const liveRegion = document.getElementById('live-region');
const successPanel = document.getElementById('reservation-success');
const newReservationButton = document.getElementById('new-reservation');

const errorElements = {
  date: document.getElementById('date-error'),
  hour: document.getElementById('hour-error'),
  name: document.getElementById('name-error'),
  phone: document.getElementById('phone-error')
};

const submitLabel = submitButton.textContent;
let slotsRequest = null;

function announce(message) {
  liveRegion.textContent = message;
}

// 1 volný stůl, 2–4 volné stoly, 5+ volných stolů
function formatAvailability(count) {
  if (count === 1) return '1 volný stůl';
  if (count >= 2 && count <= 4) return `${count} volné stoly`;
  return `${count} volných stolů`;
}

function getSelectedValue(name) {
  return form.querySelector(`input[name="${name}"]:checked`)?.value ?? '';
}

/* --- Chyby u polí ------------------------------------------------------- */

function showFieldError(field, message) {
  errorElements[field].textContent = message;
  const input = form.elements[field];
  if (input instanceof HTMLInputElement) {
    input.setAttribute('aria-invalid', 'true');
  }
}

function clearErrors() {
  for (const [field, element] of Object.entries(errorElements)) {
    element.textContent = '';
    const input = form.elements[field];
    if (input instanceof HTMLInputElement) {
      input.removeAttribute('aria-invalid');
    }
  }
  formMessage.textContent = '';
}

function showFieldErrors(fields) {
  for (const [field, message] of Object.entries(fields)) {
    if (errorElements[field]) {
      showFieldError(field, message);
    }
  }
  focusFirstError(fields);
  announce('Formulář obsahuje chyby. Zkontrolujte prosím zvýrazněná pole.');
}

function focusFirstError(fields) {
  const order = ['date', 'hour', 'name', 'phone'];
  const first = order.find((field) => fields[field]);
  if (!first) return;

  const target = first === 'date' || first === 'hour'
    ? form.querySelector(`input[name="${first}"]:not(:disabled)`)
    : form.elements[first];
  target?.focus();
}

/* --- Sloty ---------------------------------------------------------------- */

function renderSlots(slots) {
  const fragment = document.createDocumentFragment();

  for (const slot of slots) {
    const element = slotTemplate.content.cloneNode(true);
    const input = element.querySelector('[data-slot-input]');
    input.value = String(slot.hour);
    input.disabled = !slot.bookable;
    element.querySelector('[data-slot-time]').textContent = slot.time;
    element.querySelector('[data-slot-info]').textContent = slot.bookable ? formatAvailability(slot.available) : 'obsazeno';
    fragment.append(element);
  }

  slotList.replaceChildren(fragment);
}

async function loadSlots(date) {
  slotsRequest?.abort();
  slotsRequest = new AbortController();

  slotList.replaceChildren();
  slotsStatus.textContent = 'Načítám volné časy…';
  errorElements.hour.textContent = '';

  try {
    const response = await fetch(`/api/slots?date=${encodeURIComponent(date)}`, { signal: slotsRequest.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const { slots } = await response.json();
    renderSlots(slots);

    const hasFreeSlot = slots.some((slot) => slot.bookable);
    slotsStatus.textContent = hasFreeSlot ? '' : 'V tento den už nejsou volné časy. Vyberte prosím jiný den.';
    announce(hasFreeSlot ? 'Volné časy načteny.' : slotsStatus.textContent);
  } catch (error) {
    if (error.name === 'AbortError') return;
    slotsStatus.textContent = 'Volné časy se nepodařilo načíst. Zkuste to prosím znovu.';
    announce(slotsStatus.textContent);
  }
}

/* --- Validace a odeslání ---------------------------------------------------- */

function validate(data) {
  const fields = {};
  const nameLength = [...data.name].length;

  if (!data.date) fields.date = 'Vyberte den rezervace.';
  if (!data.hour) fields.hour = 'Vyberte čas rezervace.';
  if (nameLength < NAME_MIN_LENGTH || nameLength > NAME_MAX_LENGTH) {
    fields.name = `Zadejte jméno o délce ${NAME_MIN_LENGTH} až ${NAME_MAX_LENGTH} znaků.`;
  }
  if (!PHONE_PATTERN.test(data.phone.replace(/\s+/g, ''))) {
    fields.phone = 'Zadejte platné telefonní číslo.';
  }

  return fields;
}

function setSubmitting(isSubmitting) {
  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? 'Odesílám…' : submitLabel;
}

function showSuccess(reservation, name) {
  document.getElementById('success-when').textContent = `${reservation.dateLabel} v ${reservation.time}`;
  document.getElementById('success-name').textContent = name;
  form.hidden = true;
  successPanel.hidden = false;
  // behavior 'auto' převezme CSS scroll-behavior, takže respektuje prefers-reduced-motion
  successPanel.scrollIntoView({ behavior: 'auto', block: 'start' });
  successPanel.focus({ preventScroll: true });
  announce(`Rezervace je potvrzená na ${reservation.dateLabel} v ${reservation.time}.`);
}

async function submitReservation(event) {
  event.preventDefault();
  clearErrors();

  const data = {
    date: getSelectedValue('date'),
    hour: getSelectedValue('hour'),
    name: form.elements.name.value.trim(),
    phone: form.elements.phone.value.trim()
  };

  const errors = validate(data);
  if (Object.keys(errors).length > 0) {
    showFieldErrors(errors);
    return;
  }

  setSubmitting(true);

  try {
    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, hour: Number(data.hour) })
    });
    const result = await response.json();

    if (response.status === 201) {
      showSuccess(result, data.name);
    } else if (response.status === 400 && result.fields) {
      showFieldErrors(result.fields);
    } else if (response.status === 409) {
      formMessage.textContent = result.message;
      await loadSlots(data.date);
      announce(result.message);
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch {
    formMessage.textContent = 'Rezervaci se nepodařilo odeslat. Zkuste to prosím znovu, nebo nám zavolejte.';
    announce(formMessage.textContent);
  } finally {
    setSubmitting(false);
  }
}

function startNewReservation() {
  form.reset();
  clearErrors();
  successPanel.hidden = true;
  form.hidden = false;
  selectInitialDay();
  form.querySelector('input[name="date"]:checked')?.focus();
}

// Vybere dříve zvolený den (např. po návratu zpět v prohlížeči), jinak první nabízený
function selectInitialDay() {
  const day = dayList.querySelector('input[name="date"]:checked') ?? dayList.querySelector('input[name="date"]');
  if (!day) {
    slotsStatus.textContent = 'V nejbližších dnech nelze rezervovat.';
    return;
  }
  day.checked = true;
  loadSlots(day.value);
}

dayList.addEventListener('change', (event) => {
  if (event.target.name === 'date') {
    errorElements.date.textContent = '';
    loadSlots(event.target.value);
  }
});

slotList.addEventListener('change', () => {
  errorElements.hour.textContent = '';
});

form.addEventListener('submit', submitReservation);
newReservationButton.addEventListener('click', startNewReservation);

selectInitialDay();
