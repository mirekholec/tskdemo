// Přihlášení do administrace. Session jsou jen v paměti, restart serveru uživatele odhlásí.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import config from '../config.js';

export const SESSION_COOKIE = 'admin_session';
export const SESSION_TTL_SECONDS = config.admin.sessionTtlMinutes * 60;

// token → čas expirace (ms)
const sessions = new Map();

function sha256(value) {
  return createHash('sha256').update(String(value)).digest();
}

// Porovnání v konstantním čase. Hash sjednotí délku obou vstupů, kterou timingSafeEqual vyžaduje.
export function verifyPassword(password) {
  return timingSafeEqual(sha256(password ?? ''), sha256(config.admin.password));
}

function removeExpiredSessions(now) {
  for (const [token, expiresAt] of sessions) {
    if (expiresAt <= now) {
      sessions.delete(token);
    }
  }
}

export function createSession() {
  const now = Date.now();
  removeExpiredSessions(now);

  const token = randomBytes(32).toString('hex');
  sessions.set(token, now + SESSION_TTL_SECONDS * 1000);
  return token;
}

export function isValidSession(token) {
  if (!token) {
    return false;
  }

  const expiresAt = sessions.get(token);
  if (expiresAt === undefined) {
    return false;
  }

  if (expiresAt <= Date.now()) {
    sessions.delete(token);
    return false;
  }

  return true;
}

export function destroySession(token) {
  sessions.delete(token);
}
