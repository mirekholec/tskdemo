// Administrace: přihlášení, seznam rezervací a jejich mazání.
import { formatDateTime, formatFullDate, parseIsoDate, parseSqlDateTime } from '../lib/dates.js';
import { parseCookies, readBody, redirect, sendHtml, setCookie } from '../lib/http.js';
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSession,
  destroySession,
  isValidSession,
  verifyPassword
} from '../lib/session.js';
import { render, renderFragment } from '../lib/template.js';

const LAYOUT = 'layouts/admin';
const COOKIE_OPTIONS = { path: '/admin', httpOnly: true, sameSite: 'Strict' };

function getSessionToken(req) {
  return parseCookies(req)[SESSION_COOKIE];
}

function isAuthenticated(req) {
  return isValidSession(getSessionToken(req));
}

// 1 rezervace, 2–4 rezervace, 5+ rezervací
function formatReservationCount(count) {
  const noun = count === 1 || (count >= 2 && count <= 4) ? 'rezervace' : 'rezervací';
  return `${count} ${noun}`;
}

export function createAdminRoutes({ reservationService }) {
  async function renderLogin(res, { error = '', status = 200 } = {}) {
    const html = await render(
      'pages/admin/login',
      { title: 'Přihlášení', currentPath: '/admin', error },
      { layout: LAYOUT }
    );
    sendHtml(res, html, status);
  }

  async function renderReservations(req, res) {
    const reservations = reservationService.listUpcoming(new Date());

    const rows = await Promise.all(
      reservations.map((reservation) => {
        const dateLabel = formatFullDate(parseIsoDate(reservation.date));
        return renderFragment('partials/admin-row', {
          ...reservation,
          rowModifier: reservation.status === 'upcoming' ? '' : ` admin-table__row--${reservation.status}`,
          dayBadge: reservation.status === 'upcoming' ? '' : 'Dnes',
          dateLabel,
          createdLabel: formatDateTime(parseSqlDateTime(reservation.createdAt)),
          confirmMessage: `Opravdu smazat rezervaci ${reservation.name} (${dateLabel} ${reservation.time})?`
        });
      })
    );

    const html = await render(
      'pages/admin/reservations',
      {
        title: 'Rezervace',
        currentPath: '/admin',
        rows: rows.join(''),
        countLabel: formatReservationCount(reservations.length),
        emptyMessage: reservations.length === 0 ? 'Zatím žádné rezervace.' : '',
        flash: req.query.get('deleted') === '1' ? 'Rezervace byla smazána.' : ''
      },
      { layout: LAYOUT }
    );
    sendHtml(res, html);
  }

  async function index(req, res) {
    if (isAuthenticated(req)) {
      await renderReservations(req, res);
    } else {
      await renderLogin(res);
    }
  }

  async function login(req, res) {
    const { password } = await readBody(req);

    if (!verifyPassword(password)) {
      await renderLogin(res, { error: 'Nesprávné heslo.', status: 401 });
      return;
    }

    setCookie(res, SESSION_COOKIE, createSession(), { ...COOKIE_OPTIONS, maxAge: SESSION_TTL_SECONDS });
    redirect(res, '/admin');
  }

  async function logout(req, res) {
    destroySession(getSessionToken(req));
    setCookie(res, SESSION_COOKIE, '', { ...COOKIE_OPTIONS, maxAge: 0 });
    redirect(res, '/admin');
  }

  async function deleteReservation(req, res, params) {
    if (!isAuthenticated(req)) {
      redirect(res, '/admin');
      return;
    }

    const deleted = reservationService.deleteReservation(params.id);
    redirect(res, deleted ? '/admin?deleted=1' : '/admin');
  }

  return [
    { method: 'GET', path: '/admin', handler: index },
    { method: 'POST', path: '/admin/login', handler: login },
    { method: 'POST', path: '/admin/logout', handler: logout },
    { method: 'POST', path: '/admin/reservations/:id/delete', handler: deleteReservation }
  ];
}
