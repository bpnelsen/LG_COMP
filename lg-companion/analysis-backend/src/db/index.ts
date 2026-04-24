import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DB_PATH ?? './data/companion.db';
fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });

const db = new Database(path.resolve(dbPath));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS captures (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    url         TEXT NOT NULL,
    title       TEXT NOT NULL DEFAULT '',
    trigger     TEXT NOT NULL,
    screenshot  TEXT NOT NULL,         -- base64 data URL
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS analyses (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    capture_id   INTEGER NOT NULL REFERENCES captures(id),
    page_name    TEXT NOT NULL DEFAULT '',
    section      TEXT NOT NULL DEFAULT '',
    raw_json     TEXT NOT NULL,        -- full Claude response JSON
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pages (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    url_pattern  TEXT NOT NULL UNIQUE,
    page_name    TEXT NOT NULL,
    section      TEXT NOT NULL DEFAULT '',
    first_seen   TEXT NOT NULL DEFAULT (datetime('now')),
    last_seen    TEXT NOT NULL DEFAULT (datetime('now')),
    visit_count  INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS components (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id      INTEGER NOT NULL REFERENCES pages(id),
    type         TEXT NOT NULL,
    label        TEXT NOT NULL,
    purpose      TEXT NOT NULL DEFAULT '',
    raw_fields   TEXT NOT NULL DEFAULT '[]'  -- JSON array
  );

  CREATE TABLE IF NOT EXISTS flows (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    from_pattern TEXT NOT NULL,
    to_pattern   TEXT NOT NULL,
    trigger      TEXT NOT NULL,
    count        INTEGER NOT NULL DEFAULT 1,
    UNIQUE(from_pattern, to_pattern, trigger)
  );
`);

export default db;
