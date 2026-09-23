import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdmin } from '../auth.js';
import { ah } from '../lib/asyncHandler.js';

export const visitsRouter = Router();

// Public — fired once per page load from the frontend router. No cookies or
// session tracking, just a raw pageview log for the admin dashboard.
visitsRouter.post('/', ah(async (req, res) => {
  const path = String(req.body?.path || '/').slice(0, 200);
  await db.prepare('INSERT INTO site_visits (path) VALUES (?)').run(path);
  res.status(204).end();
}));

visitsRouter.get('/stats', requireAuth, requireAdmin, ah(async (_req, res) => {
  const total = (await db.prepare('SELECT COUNT(*) AS n FROM site_visits').get()).n;
  const today = (await db
    .prepare(`SELECT COUNT(*) AS n FROM site_visits WHERE date(created_at) = date('now')`)
    .get()).n;
  const last7Days = await db
    .prepare(`
      SELECT date(created_at) AS day, COUNT(*) AS n
      FROM site_visits
      WHERE created_at >= datetime('now', '-6 days')
      GROUP BY day
      ORDER BY day
    `)
    .all();
  const topPaths = await db
    .prepare(`
      SELECT path, COUNT(*) AS n
      FROM site_visits
      GROUP BY path
      ORDER BY n DESC
      LIMIT 5
    `)
    .all();

  res.json({ total, today, last7Days, topPaths });
}));
