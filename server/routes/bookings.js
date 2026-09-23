import { Router } from 'express';
import { db } from '../db.js';
import { optionalAuth, requireAuth, requireAdmin } from '../auth.js';
import { ah } from '../lib/asyncHandler.js';

export const bookingsRouter = Router();

const ACTIVE_STATUSES = ['pending', 'confirmed'];
const ALL_STATUSES = ['pending', 'confirmed', 'cancelled'];

// Admin-only — every booking, newest session first, for the admin dashboard.
bookingsRouter.get('/', requireAuth, requireAdmin, ah(async (_req, res) => {
  const bookings = await db.prepare('SELECT * FROM bookings ORDER BY starts_at DESC').all();
  res.json({ bookings });
}));

// month: "YYYY-MM". Mirrors the supabase `booked_slots` view — exposes just
// enough to render the calendar without leaking names/emails to anonymous visitors.
bookingsRouter.get('/slots', ah(async (req, res) => {
  const month = req.query.month;
  if (!/^\d{4}-\d{2}$/.test(month || '')) {
    return res.status(400).json({ error: 'month must be in YYYY-MM format.' });
  }
  const monthStart = new Date(`${month}-01T00:00:00.000Z`);
  const nextMonth = new Date(monthStart);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);

  const rows = await db
    .prepare(`
      SELECT starts_at, duration_hours FROM bookings
      WHERE status IN (${ACTIVE_STATUSES.map(() => '?').join(',')})
        AND starts_at >= ? AND starts_at < ?
    `)
    .all(...ACTIVE_STATUSES, monthStart.toISOString(), nextMonth.toISOString());

  res.json({ slots: rows });
}));

// Turso is a network round-trip, so the conflict-check + insert below is no
// longer implicitly atomic the way it was under node:sqlite's synchronous,
// single-threaded DatabaseSync. This in-process lock serializes just that
// critical section — enough to stay race-free on a single server instance
// (which is what Render's free tier runs; it wouldn't be enough across
// multiple instances, but there's only ever one here).
let bookingLock = Promise.resolve();
function withBookingLock(fn) {
  const run = bookingLock.then(fn, fn);
  bookingLock = run.then(() => {}, () => {});
  return run;
}

// Guests are allowed to book (user_id ends up null), matching the original
// "Anyone can create a booking" RLS policy.
bookingsRouter.post('/', optionalAuth, ah(async (req, res) => {
  const {
    name, email, phone, session_type: sessionType,
    starts_at: startsAt, duration_hours: durationHours,
    notes, total_xaf: totalXaf, total_usd: totalUsd,
  } = req.body || {};

  if (!name?.trim() || !email?.trim() || !sessionType || !startsAt || !durationHours) {
    return res.status(400).json({ error: 'Missing required booking fields.' });
  }

  const newStart = new Date(startsAt);
  if (Number.isNaN(newStart.getTime())) {
    return res.status(400).json({ error: 'Invalid starts_at.' });
  }
  const newEnd = new Date(newStart.getTime() + durationHours * 3600_000);

  const dayStart = new Date(newStart);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart.getTime() + 24 * 3600_000);

  const outcome = await withBookingLock(async () => {
    const candidates = await db
      .prepare(`
        SELECT starts_at, duration_hours FROM bookings
        WHERE status IN (${ACTIVE_STATUSES.map(() => '?').join(',')})
          AND starts_at >= ? AND starts_at < ?
      `)
      .all(...ACTIVE_STATUSES, dayStart.toISOString(), dayEnd.toISOString());

    const conflict = candidates.some((b) => {
      const bStart = new Date(b.starts_at);
      const bEnd = new Date(bStart.getTime() + b.duration_hours * 3600_000);
      return newStart < bEnd && bStart < newEnd;
    });
    if (conflict) return { conflict: true };

    const result = await db
      .prepare(`
        INSERT INTO bookings (user_id, name, email, phone, session_type, starts_at, duration_hours, notes, total_xaf, total_usd)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        req.userId || null,
        name.trim(),
        email.trim().toLowerCase(),
        phone?.trim() || null,
        sessionType,
        newStart.toISOString(),
        durationHours,
        notes?.trim() || null,
        totalXaf ?? null,
        totalUsd ?? null
      );

    const booking = await db.prepare('SELECT * FROM bookings WHERE id = ?').get(result.lastInsertRowid);
    return { booking };
  });

  if (outcome.conflict) {
    return res.status(409).json({ error: 'That slot was just taken — please pick another.' });
  }
  res.status(201).json({ booking: outcome.booking });
}));

// Admin-only — confirm/cancel a booking.
bookingsRouter.patch('/:id', requireAuth, requireAdmin, ah(async (req, res) => {
  const { status } = req.body || {};
  if (!ALL_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${ALL_STATUSES.join(', ')}.` });
  }
  const info = await db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found.' });
  const booking = await db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  res.json({ booking });
}));
