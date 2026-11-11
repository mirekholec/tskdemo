// Otevření SQLite databáze a vytvoření schématu.
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import config from '../config.js';

const PROJECT_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SCHEMA_FILE = fileURLToPath(new URL('./schema.sql', import.meta.url));
const IN_MEMORY = ':memory:';

// Cesta je relativní ke kořeni projektu. Hodnota ":memory:" vytvoří dočasnou DB pro testy.
export function openDatabase(file = config.database.file) {
  const location = file === IN_MEMORY ? IN_MEMORY : path.resolve(PROJECT_ROOT, file);

  if (location !== IN_MEMORY) {
    mkdirSync(path.dirname(location), { recursive: true });
  }

  const db = new DatabaseSync(location);

  // Při souběhu se seedem počká na uvolnění zámku místo okamžité chyby
  db.exec('PRAGMA busy_timeout = 5000');
  if (location !== IN_MEMORY) {
    db.exec('PRAGMA journal_mode = WAL');
  }
  db.exec(readFileSync(SCHEMA_FILE, 'utf8'));

  return db;
}
