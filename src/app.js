// Hlavní handler požadavků: statické soubory → router → 404 / 500.
import { HttpError, sendHtml, sendJson } from './lib/http.js';
import { createRouter } from './lib/router.js';
import { serveStatic } from './lib/static.js';
import { render } from './lib/template.js';
import { createAdminRoutes } from './routes/admin.js';
import { createPageRoutes } from './routes/pages.js';
import { createReservationsApiRoutes } from './routes/reservations-api.js';

function isApiRequest(req) {
  return req.pathname?.startsWith('/api/') ?? false;
}

function logRequest(req, res, startedAt) {
  const duration = Math.round(performance.now() - startedAt);
  console.log(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
}

async function sendNotFound(req, res) {
  if (isApiRequest(req)) {
    sendJson(res, { error: 'not_found' }, 404);
    return;
  }
  const html = await render('pages/not-found', { title: 'Stránka nenalezena', currentPath: req.pathname }, { layout: 'layouts/main' });
  sendHtml(res, html, 404);
}

async function sendError(req, res, error) {
  const status = error instanceof HttpError ? error.status : 500;

  if (status === 500) {
    console.error(error);
  }

  if (res.headersSent) {
    res.destroy();
    return;
  }

  if (isApiRequest(req)) {
    sendJson(res, { error: status === 500 ? 'server_error' : 'bad_request', message: error.message }, status);
    return;
  }

  try {
    const html = await render('pages/error', { title: 'Chyba', currentPath: req.pathname }, { layout: 'layouts/main' });
    sendHtml(res, html, status);
  } catch (renderError) {
    // Když selže i vykreslení chybové stránky, pošleme aspoň prostý text
    console.error(renderError);
    res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Omlouváme se, něco se pokazilo.');
  }
}

export function createApp({ reservationService }) {
  const router = createRouter([
    ...createPageRoutes({ reservationService }),
    ...createReservationsApiRoutes({ reservationService }),
    ...createAdminRoutes({ reservationService })
  ]);

  return async function handleRequest(req, res) {
    const startedAt = performance.now();
    res.on('finish', () => logRequest(req, res, startedAt));

    try {
      const url = new URL(req.url, 'http://localhost');
      req.pathname = url.pathname;
      req.query = url.searchParams;

      if (await serveStatic(req, res, req.pathname)) {
        return;
      }

      const match = router.match(req.method, req.pathname);
      if (!match) {
        await sendNotFound(req, res);
        return;
      }

      await match.handler(req, res, match.params);
    } catch (error) {
      await sendError(req, res, error);
    }
  };
}
