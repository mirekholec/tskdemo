// JSON API pro rezervační formulář.
import { readBody, sendJson } from '../lib/http.js';
import { SlotFullError, ValidationError } from '../services/reservation-service.js';

function sendServiceError(res, error) {
  if (error instanceof ValidationError) {
    sendJson(res, { error: 'validation', fields: error.fields }, 400);
    return;
  }
  if (error instanceof SlotFullError) {
    sendJson(res, { error: 'slot_full', message: error.message }, 409);
    return;
  }
  throw error;
}

export function createReservationsApiRoutes({ reservationService }) {
  async function getSlots(req, res) {
    try {
      const result = reservationService.getSlots(req.query.get('date') ?? '', new Date());
      sendJson(res, result);
    } catch (error) {
      sendServiceError(res, error);
    }
  }

  async function createReservation(req, res) {
    const input = await readBody(req);

    try {
      const reservation = reservationService.createReservation(input, new Date());
      sendJson(
        res,
        {
          id: reservation.id,
          date: reservation.date,
          time: reservation.time,
          dateLabel: reservation.dateLabel
        },
        201
      );
    } catch (error) {
      sendServiceError(res, error);
    }
  }

  return [
    { method: 'GET', path: '/api/slots', handler: getSlots },
    { method: 'POST', path: '/api/reservations', handler: createReservation }
  ];
}
