-- ============================================================================
-- SPIGIMENTALS — local SQLite schema
-- Mirrors supabase/schema.sql. Auth + row-level access checks that Supabase
-- gave us for free via RLS are enforced in the route handlers instead (see
-- server/middleware/auth.js and each route file).
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Mirrors auth.users + public.profiles split: password_hash never leaves `users`.
CREATE TABLE IF NOT EXISTS profiles (
  id               TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email            TEXT UNIQUE NOT NULL,
  name             TEXT,
  profile_pic      TEXT,
  country          TEXT,
  residence        TEXT,
  tutor_badge      INTEGER NOT NULL DEFAULT 0,
  is_admin         INTEGER NOT NULL DEFAULT 0,
  enrolled_courses TEXT NOT NULL DEFAULT '[]',
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS classroom_posts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id   TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text        TEXT,
  media_url   TEXT,
  media_type  TEXT,
  reactions   TEXT NOT NULL DEFAULT '{"👍":0,"❤️":0,"💡":0}',
  shares      INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS classroom_posts_created_at_idx ON classroom_posts (created_at DESC);

CREATE TABLE IF NOT EXISTS post_comments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id     INTEGER NOT NULL REFERENCES classroom_posts(id) ON DELETE CASCADE,
  author_id   TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS post_ratings (
  post_id     INTEGER NOT NULL REFERENCES classroom_posts(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score       INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (post_id, user_id)
);

-- Cart persists across devices once signed in. Guest carts stay in localStorage
-- on the client and get merged in here on first sign-in (see CartContext.jsx).
CREATE TABLE IF NOT EXISTS carts (
  user_id     TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  items       TEXT NOT NULL DEFAULT '[]',
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  email           TEXT NOT NULL,
  total_usd       REAL NOT NULL,
  payment_method  TEXT,
  payment_ref     TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_type     TEXT NOT NULL,
  item_id       INTEGER NOT NULL,
  title         TEXT NOT NULL,
  license       TEXT,
  price_usd     REAL NOT NULL,
  download_url  TEXT
);

-- Guests may create bookings (user_id nullable) — matches supabase policy
-- "Anyone can create a booking". Overlap prevention happens in routes/bookings.js
-- inside a single synchronous transaction, so it's race-free without a DB-level
-- exclusion constraint (SQLite has no EXCLUDE, unlike Postgres).
CREATE TABLE IF NOT EXISTS bookings (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  session_type    TEXT NOT NULL,
  starts_at       TEXT NOT NULL,
  duration_hours  INTEGER NOT NULL DEFAULT 2,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  total_xaf       REAL,
  total_usd       REAL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS bookings_starts_at_idx ON bookings (starts_at);

-- ----------------------------------------------------------------------------
-- Storefront content — replaces the static src/data/*.js files so admins can
-- manage it at runtime (see server/routes/resource.js, server/resources.js,
-- and the admin-only requireAdmin checks). Tag/format/os lists are stored as
-- JSON text, same convention as profiles.enrolled_courses.
-- `song_key` avoids using the bare word "key" as a column name.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tracks (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  artist        TEXT,
  bpm           INTEGER,
  song_key      TEXT,
  mood          TEXT,
  tags          TEXT NOT NULL DEFAULT '[]',
  plays         TEXT,
  play_count    INTEGER NOT NULL DEFAULT 0,
  spotify_url   TEXT,
  youtube_url   TEXT,
  audio_url     TEXT,
  cover_url     TEXT,
  position      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS beats (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL,
  bpm             INTEGER,
  song_key        TEXT,
  mood            TEXT,
  price_basic     REAL,
  price_premium   REAL,
  price_exclusive REAL,
  tags            TEXT NOT NULL DEFAULT '[]',
  plays           TEXT,
  play_count      INTEGER NOT NULL DEFAULT 0,
  youtube_url     TEXT,
  audio_url       TEXT,
  cover_url       TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Lightweight pageview log — one row per page load, fired from the frontend
-- on every route change. No session/cookie tracking, just counts over time.
CREATE TABLE IF NOT EXISTS site_visits (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  path        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS site_visits_created_at_idx ON site_visits (created_at);

CREATE TABLE IF NOT EXISTS packs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  description   TEXT,
  price         REAL NOT NULL,
  sample_count  INTEGER,
  tags          TEXT NOT NULL DEFAULT '[]',
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Uploaded sample files for a pack. Files themselves live under
-- server/uploads/packs/<pack_id>/ — see server/lib/upload.js. Cascades on
-- pack delete; server/routes/resource.js also unlinks the files from disk
-- via the `beforeDelete` hook wired in index.js (the FK cascade only cleans
-- up DB rows, not the filesystem).
CREATE TABLE IF NOT EXISTS pack_files (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  pack_id     INTEGER NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  filename    TEXT NOT NULL,
  url         TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS plugins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  tagline       TEXT,
  description   TEXT,
  price         REAL NOT NULL,
  category      TEXT,
  formats       TEXT NOT NULL DEFAULT '[]',
  os            TEXT NOT NULL DEFAULT '[]',
  version       TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS courses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  instructor    TEXT,
  description   TEXT,
  price         REAL NOT NULL,
  lessons       INTEGER,
  level         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
