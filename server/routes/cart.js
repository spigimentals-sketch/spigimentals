import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

export const cartRouter = Router();

cartRouter.get('/', requireAuth, (req, res) => {
  const row = db.prepare('SELECT items FROM carts WHERE user_id = ?').get(req.userId);
  res.json({ items: row ? JSON.parse(row.items) : [] });
});

cartRouter.put('/', requireAuth, (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  db.prepare(`
    INSERT INTO carts (user_id, items, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET items = excluded.items, updated_at = excluded.updated_at
  `).run(req.userId, JSON.stringify(items));
  res.json({ items });
});
