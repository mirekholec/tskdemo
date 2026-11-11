// Obsluha statických souborů ze složky src/assets.
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const ASSETS_DIR = fileURLToPath(new URL('../assets/', import.meta.url));
const URL_PREFIX = '/assets/';

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

// Převede URL cestu na cestu k souboru. Vrátí null, pokud by vedla mimo src/assets.
function resolveAssetPath(pathname) {
  let relative;
  try {
    relative = decodeURIComponent(pathname.slice(URL_PREFIX.length));
  } catch {
    return null;
  }

  if (relative.includes('\0')) {
    return null;
  }

  const filePath = path.resolve(ASSETS_DIR, relative);
  return filePath.startsWith(ASSETS_DIR) ? filePath : null;
}

// Pošle soubor a vrátí true. Když soubor neexistuje, vrátí false a odpověď nechá volajícímu.
export async function serveStatic(req, res, pathname) {
  if (!pathname.startsWith(URL_PREFIX) || !['GET', 'HEAD'].includes(req.method)) {
    return false;
  }

  const filePath = resolveAssetPath(pathname);
  if (!filePath) {
    return false;
  }

  let stats;
  try {
    stats = await stat(filePath);
  } catch {
    return false;
  }

  if (!stats.isFile()) {
    return false;
  }

  res.writeHead(200, {
    'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream',
    'Content-Length': stats.size,
    'Cache-Control': 'no-cache',
    'Last-Modified': stats.mtime.toUTCString()
  });

  if (req.method === 'HEAD') {
    res.end();
    return true;
  }

  // pipeline zavře soubor i při předčasném odpojení klienta (jinak by zůstal otevřený deskriptor)
  try {
    await pipeline(createReadStream(filePath), res);
  } catch (error) {
    if (error.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
      throw error;
    }
  }
  return true;
}
