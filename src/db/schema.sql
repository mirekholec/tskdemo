CREATE TABLE IF NOT EXISTS reservations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  date       TEXT    NOT NULL,                  -- YYYY-MM-DD
  hour       INTEGER NOT NULL CHECK (hour BETWEEN 0 AND 23),
  name       TEXT    NOT NULL,
  phone      TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_reservations_slot ON reservations (date, hour);
