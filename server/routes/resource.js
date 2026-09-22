import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdmin } from '../auth.js';

// Builds a public-read / admin-write CRUD router for one content table.
// `table` and every column name come only from server/resources.js (never
// from request input), so string-interpolating them into SQL here is safe —
// all request-supplied values still go through parameterized placeholders.
export function createResourceRouter(table, fields, { beforeDelete } = {}) {
  const router = Router();

  const serialize = (row) => {
    const out = { id: row.id };
    for (const f of fields) {
      out[f.key] = f.array ? JSON.parse(row[f.col] || '[]') : row[f.col];
    }
    return out;
  };

  const get = db.prepare(`SELECT * FROM ${table} WHERE id = ?`);

  router.get('/', (_req, res) => {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY id`).all();
    res.json({ items: rows.map(serialize) });
  });

  router.post('/', requireAuth, requireAdmin, (req, res) => {
    const body = req.body || {};
    const present = fields.filter((f) => body[f.key] !== undefined);
    if (!present.length) return res.status(400).json({ error: 'No fields provided.' });

    const colList = present.map((f) => `"${f.col}"`).join(', ');
    const placeholders = present.map(() => '?').join(', ');
    const values = present.map((f) => (f.array ? JSON.stringify(body[f.key] || []) : body[f.key]));

    const result = db.prepare(`INSERT INTO ${table} (${colList}) VALUES (${placeholders})`).run(...values);
    res.status(201).json({ item: serialize(get.get(result.lastInsertRowid)) });
  });

  router.put('/:id', requireAuth, requireAdmin, (req, res) => {
    const body = req.body || {};
    const present = fields.filter((f) => body[f.key] !== undefined);
    if (!present.length) return res.status(400).json({ error: 'No fields provided.' });

    const setClause = present.map((f) => `"${f.col}" = ?`).join(', ');
    const values = present.map((f) => (f.array ? JSON.stringify(body[f.key] || []) : body[f.key]));

    const info = db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`).run(...values, req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Not found.' });
    res.json({ item: serialize(get.get(req.params.id)) });
  });

  router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
    const row = get.get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found.' });
    beforeDelete?.(row); // e.g. unlink uploaded files — the FK cascade only cleans up DB rows
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
    res.status(204).end();
  });

  return router;
}
