// Pomocné funkce pro práci s HTTP požadavky a odpověďmi.

const DEFAULT_BODY_LIMIT = 10 * 1024;

// Chyba, která nese HTTP status kód. app.js ji převede na odpověď.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

// Přečte tělo požadavku (JSON nebo formulář) s limitem velikosti.
export async function readBody(req, { limit = DEFAULT_BODY_LIMIT } = {}) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) {
      throw new HttpError(413, 'Tělo požadavku je příliš velké.');
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  if (raw === '') {
    return {};
  }

  const contentType = (req.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();

  if (contentType === 'application/json') {
    try {
      const data = JSON.parse(raw);
      return data !== null && typeof data === 'object' ? data : {};
    } catch {
      throw new HttpError(400, 'Neplatný JSON.');
    }
  }

  if (contentType === 'application/x-www-form-urlencoded') {
    return Object.fromEntries(new URLSearchParams(raw));
  }

  throw new HttpError(415, 'Nepodporovaný typ obsahu.');
}

export function sendHtml(res, html, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(html)
  });
  res.end(html);
}

export function sendJson(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

// 303 See Other: po POST se prohlížeč přesměruje na GET (vzor Post/Redirect/Get).
export function redirect(res, location, status = 303) {
  res.writeHead(status, { Location: location });
  res.end();
}

export function parseCookies(req) {
  const header = req.headers.cookie ?? '';
  const cookies = {};

  for (const part of header.split(';')) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }
    const name = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();
    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
  }

  return cookies;
}

export function setCookie(res, name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.secure) parts.push('Secure');

  // Zachová případné dříve nastavené cookies v téže odpovědi
  const existing = res.getHeader('Set-Cookie') ?? [];
  const cookies = Array.isArray(existing) ? existing : [String(existing)];
  res.setHeader('Set-Cookie', [...cookies, parts.join('; ')]);
}
