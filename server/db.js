import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || join(__dirname, 'data', 'spigimentals.db');

// `data/` is gitignored (the .db file shouldn't be committed), so on a fresh
// clone/deploy the directory itself doesn't exist yet — node:sqlite can't
// create the file in a directory that isn't there.
const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');

const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Additive migrations for DB files created before a column existed. Each is
// a no-op (caught and ignored) once already applied — no migration framework
// needed for a single-file SQLite dev DB.
const MIGRATIONS = [
  `ALTER TABLE tracks ADD COLUMN audio_url TEXT`,
  `ALTER TABLE beats ADD COLUMN audio_url TEXT`,
  `ALTER TABLE tracks ADD COLUMN cover_url TEXT`,
  `ALTER TABLE tracks ADD COLUMN play_count INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE beats ADD COLUMN play_count INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE tracks ADD COLUMN youtube_url TEXT`,
  `ALTER TABLE beats ADD COLUMN youtube_url TEXT`,
  `ALTER TABLE beats ADD COLUMN cover_url TEXT`,
];
for (const migration of MIGRATIONS) {
  try {
    db.exec(migration);
  } catch {
    // column already exists
  }
}
