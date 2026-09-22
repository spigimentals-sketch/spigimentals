import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdmin } from '../auth.js';

export const visitsRouter = Router();

// Public — fired once per page load from the frontend router. No cookies or
// session tracking, just a raw pageview log for the admin dashboard.
visitsRouter.post('/', (req, res) => {
  const path = String(req.body?.path || '/').slice(0, 200);
  db.prepare('INSERT INTO site_visits (path) VALUES (?)').run(path);
  res.status(204).end();
});

visitsRouter.get('/stats', requireAuth, requireAdmin, (_req, res) => {
  const total = db.prepare('SELECT COUNT(*) AS n FROM site_visits').get().n;
  const today = db
    .prepare(`SELECT COUNT(*) AS n FROM site_visits WHERE date(created_at) = date('now')`)
    .get().n;
  const last7Days = db
    .prepare(`
      SELECT date(created_at) AS day, COUNT(*) AS n
      FROM site_visits
      WHERE created_at >= datetime('now', '-6 days')
      GROUP BY day
      ORDER BY day
    `)
    .all();
  const topPaths = db
    .prepare(`
      SELECT path, COUNT(*) AS n
      FROM site_visits
      GROUP BY path
      ORDER BY n DESC
      LIMIT 5
    `)
    .all();

  res.json({ total, today, last7Days, topPaths });
});
