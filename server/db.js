import { createClient } from '@libsql/client';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// TURSO_DATABASE_URL/TURSO_AUTH_TOKEN point at a real Turso database in
// production — the DB then lives outside the app entirely, so it survives
// redeploys on hosts with no persistent disk (e.g. Render's free tier).
// With neither set, this falls back to a local libSQL file for dev, which
// speaks the same async client API so no code branches on which mode it's in.
const url = process.env.TURSO_DATABASE_URL || `file:${join(__dirname, 'data', 'spigimentals.db')}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (url.startsWith('file:')) {
  const dbDir = dirname(url.replace(/^file:/, ''));
  if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });
}

const client = createClient({ url, authToken });

// Mirrors node:sqlite's DatabaseSync.prepare(sql).get/all/run shape, but
// every method is async — libSQL talks to the database over a connection
// (network for Turso, still an async API for the local file fallback), so
// every call site does `await db.prepare(...).get(...)`.
function prepare(sql) {
  return {
    async get(...args) {
      const result = await client.execute({ sql, args });
      return result.rows[0];
    },
    async all(...args) {
      const result = await client.execute({ sql, args });
      return result.rows;
    },
    async run(...args) {
      const result = await client.execute({ sql, args });
      return {
        changes: result.rowsAffected,
        lastInsertRowid: result.lastInsertRowid !== undefined ? Number(result.lastInsertRowid) : undefined,
      };
    },
  };
}

export const db = { prepare };

await client.execute('PRAGMA foreign_keys = ON;');

const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
await client.executeMultiple(schema);

// Additive migrations for DB files created before a column existed. Each is
// a no-op (caught and ignored) once already applied — no migration framework
// needed for a single-file SQLite/libSQL dev DB.
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
    await client.execute(migration);
  } catch {
    // column already exists
  }
}
