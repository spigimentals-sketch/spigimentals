# SPIGIMENTALS — Refactored Architecture

This is a drop-in folder structure for your project. It splits the monolithic `App.jsx`, adds a working cart, replaces the localStorage auth with a local Express + SQLite API, and introduces a studio booking page.

## Folder structure

```text
src/
├── App.jsx                      # Slim router + provider wiring
├── lib/
│   ├── api.js                   # Fetch client for the local server/ API
│   ├── theme.js                 # Color tokens (was the `C` object)
│   └── spotify.js               # normalizeSpotifyUrl helper
├── contexts/
│   ├── AuthContext.jsx          # Replaces localStorage user logic
│   └── CartContext.jsx          # Cart state + persistence
├── components/
│   ├── Nav.jsx                  # Top nav (now with cart icon + auth menu)
│   ├── Footer.jsx
│   ├── MiniPlayer.jsx
│   ├── Waveform.jsx
│   ├── PageHeader.jsx
│   ├── SectionHeader.jsx
│   ├── TrackRow.jsx             # Catalog row
│   ├── BeatRow.jsx              # Beat store row
│   ├── LicenseModal.jsx         # Now actually adds to cart
│   ├── CourseCard.jsx
│   ├── CourseDetail.jsx
│   └── Cart/
│       ├── CartButton.jsx       # Icon + badge for Nav
│       └── CartDrawer.jsx       # Slide-out cart panel
├── pages/
│   ├── HomePage.jsx
│   ├── CatalogPage.jsx
│   ├── BeatsPage.jsx
│   ├── PacksPage.jsx
│   ├── PluginsPage.jsx
│   ├── ClassroomPage.jsx
│   ├── BookingPage.jsx          # studio session booking
│   ├── AuthPage.jsx
│   └── AdminPage.jsx            # content CRUD, gated to profile.is_admin
└── lib/useContent.js            # fetch-list hook used by the pages above

server/                          # Local Express + SQLite API (replaces Supabase)
├── index.js                     # App entry — mounts routes, starts the server, seeds content
├── db.js                        # Opens data/spigimentals.db, applies schema.sql + migrations
├── schema.sql                   # Table definitions (SQLite dialect)
├── auth.js                      # Password hashing + JWT issuing/verification + requireAdmin
├── resources.js                 # Field maps (DB column <-> API key) for tracks/beats/packs/plugins/courses
├── seed.js                      # One-time seed of those tables from the old static data
├── scripts/make-admin.js        # CLI: flips profiles.is_admin for a given email
├── lib/upload.js                # multer config (audio-only, size-limited) + file cleanup helper
├── uploads/                     # Uploaded audio files live here on disk (gitignored), served at /uploads/*
└── routes/
    ├── auth.js                  # /api/auth/signup, /signin, /session
    ├── profile.js                # /api/profile
    ├── cart.js                  # /api/cart
    ├── bookings.js               # /api/bookings, /api/bookings/slots
    ├── resource.js                # generic public-read/admin-write CRUD, mounted per resource
    ├── trackAudio.js              # POST/DELETE /api/tracks/:id/audio — one audio file per track
    └── packFiles.js                # GET/POST/DELETE /api/packs/:packId/files — many sample files per pack
```

## Setup steps

### 1. Start the local database + API

```bash
cd server
npm install
cp .env.example .env      # set JWT_SECRET to something random for anything beyond local dev
npm run dev
```

This uses Node's built-in `node:sqlite` (no native build step, no Docker) to create `server/data/spigimentals.db` on first run and applies `schema.sql` automatically. The API listens on `http://localhost:3000` by default (`PORT` in `.env`).

Requires Node 22.5+. `node:sqlite` is still experimental upstream — expect a one-line warning on startup, which is harmless.

### 2. Install frontend dependencies

```bash
npm install react-router-dom date-fns
```

(No `@supabase/supabase-js` — the frontend just talks to the local API over `fetch`.)

### 3. Add `.env` to your project root

```text
VITE_API_URL=http://localhost:3000/api
```

If you're using Create React App instead of Vite, the prefix is `REACT_APP_` instead of `VITE_` — update `src/lib/api.js` accordingly.

### 4. Make yourself an admin

Storefront content (tracks, beats, sample packs, plugins, courses) lives in the DB and is editable from `/admin` — but only accounts with `profiles.is_admin = 1` can reach it, and there's no self-serve way to grant that (by design — it's a deliberate operator action, not an API call). Sign up on the site first, then:

```bash
cd server
npm run make-admin -- you@example.com
```

Sign out and back in on the site so the new session picks up `is_admin`. An "Admin panel" link then appears in the account menu, and `/admin` unlocks.

### 5. Migration order (don't try to do it all at once)

1. Drop in `lib/`, `data/`, and `theme.js` first. They're pure utilities — no risk.
2. Move the small presentational components (Footer, PageHeader, MiniPlayer, Waveform) into `components/`.
3. Wire up `AuthContext` and replace the localStorage auth functions. Test sign-up/sign-in.
4. Wire up `CartContext` and the cart drawer. Test adding a beat.
5. Add `BookingPage` and a `/book` route.
6. Last: move pages into `pages/` and switch from `useState` page routing to React Router.

## What each piece replaces

| Old (in App.jsx)                           | New                                                      |
| ------------------------------------------- | --------------------------------------------------------- |
| `loadUsers`, `saveUsers`, `createUser`…     | `AuthContext` + local `users` / `profiles` tables          |
| `loadClassroomPosts`, `saveClassroomPosts`  | `classroom_posts` table (schema only — no UI wired yet)    |
| `useState('home')` page routing             | React Router routes                                        |
| "Add to cart" button that did nothing       | `useCart().addItem()` + drawer                             |
| (nothing)                                   | Studio booking page + `bookings` table                     |
| Hardcoded `data/*.js` catalog               | `tracks`/`beats`/`packs`/`plugins`/`courses` tables, editable at `/admin` |

## Notes

- Access control that Supabase RLS gave for free is now enforced in `server/routes/*.js` (e.g. `requireAuth` on cart/profile routes, `optionalAuth` on bookings so guests can still book). Passwords are hashed with bcrypt; sessions are JWTs sent as `Authorization: Bearer <token>` and stored client-side in `localStorage`.
- The cart persists to localStorage (it's fine for cart — no sensitive data) and syncs to the local `carts` table once the user signs in, so a guest cart survives sign-up. The sync only clears the localStorage backup once the server write actually succeeds, so a network blip doesn't lose the cart.
- Studio bookings use a simple time-slot model. The overlap check runs server-side (`server/routes/bookings.js`) inside a single synchronous request, so two people can't double-book the same slot — the client-side check is just for UI feedback. Swap in [Cal.com](https://cal.com) embed or Calendly later if you want a real scheduler.
- This local setup is meant for development. For production you'd want a real Postgres/SQLite-on-a-volume deployment, a non-default `JWT_SECRET`, and HTTPS — the code doesn't handle any of that for you.
- Admin status (`profiles.is_admin`) is checked fresh from the DB on every write request (`requireAdmin` in `server/auth.js`), not cached in the JWT — revoking it takes effect on the admin's very next request, no token invalidation needed. Granting it only requires `npm run make-admin` (see step 4 above); there's intentionally no in-app way to self-promote.
- The plugin catalog seeds with clearly-marked placeholder entries (`Plugin Name — Replace Me`) — edit or delete them from `/admin` before launch. Checkout is still a stub (`App.jsx`'s `handleCheckout` just shows an alert) and there's no file-delivery mechanism for purchased downloads yet.
- From `/admin`, each catalog track *and* each beat can have one uploaded audio file (mp3/wav/ogg/flac/aac/m4a, 100MB cap) that plays for real in the MiniPlayer — a track's uploaded audio is preferred over its Spotify embed if both are set. Both use the same generic single-audio route (`server/routes/singleAudio.js`, `POST/DELETE /api/{tracks,beats}/:id/audio`). Each sample pack can hold many uploaded files, listed and deletable individually. Uploads are validated by MIME type server-side (`server/lib/upload.js`) and rejected otherwise; deleting a track, beat, or pack also deletes its files from disk, not just the DB rows.
- Uploaded files live under `server/uploads/` on the local filesystem — fine for development, but that won't survive or scale on most hosting platforms (ephemeral filesystems, no CDN). Swap in S3/R2/Supabase Storage before shipping this for real.
