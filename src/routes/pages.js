// Veřejné stránky: one-page web a rezervační formulář.
import config from '../config.js';
import { sendHtml } from '../lib/http.js';
import { render, renderFragment } from '../lib/template.js';

const LAYOUT = 'layouts/main';

export function createPageRoutes({ reservationService }) {
  async function home(req, res) {
    const html = await render(
      'pages/home',
      {
        title: 'Výběrová káva a domácí pečivo na Vinohradech',
        description: 'Kavárna Holubník v Praze na Vinohradech: výběrová káva, domácí pečivo a klidné místo na práci i rande. Otevřeno denně 13–20 h.',
        currentPath: req.pathname
      },
      { layout: LAYOUT }
    );
    sendHtml(res, html);
  }

  async function reservation(req, res) {
    const days = reservationService.getAvailableDays(new Date());
    const dayOptions = await Promise.all(days.map((day) => renderFragment('partials/day-option', day)));

    const html = await render(
      'pages/reservation',
      {
        title: 'Rezervace stolu',
        description: 'Rezervujte si stůl v Kavárně Holubník. Vyberte den a volný čas, stačí jméno a telefon.',
        currentPath: req.pathname,
        daysAhead: config.reservations.daysAhead,
        dayOptions: dayOptions.join('')
      },
      { layout: LAYOUT }
    );
    sendHtml(res, html);
  }

  return [
    { method: 'GET', path: '/', handler: home },
    { method: 'GET', path: '/rezervace', handler: reservation }
  ];
}
