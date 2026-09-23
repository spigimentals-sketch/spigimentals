import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdmin } from '../auth.js';
import { ah } from '../lib/asyncHandler.js';

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

  router.get('/', ah(async (_req, res) => {
    const rows = await db.prepare(`SELECT * FROM ${table} ORDER BY id`).all();
    res.json({ items: rows.map(serialize) });
  }));

  router.post('/', requireAuth, requireAdmin, ah(async (req, res) => {
    const body = req.body || {};
    const present = fields.filter((f) => body[f.key] !== undefined);
    if (!present.length) return res.status(400).json({ error: 'No fields provided.' });

    const colList = present.map((f) => `"${f.col}"`).join(', ');
    const placeholders = present.map(() => '?').join(', ');
    const values = present.map((f) => (f.array ? JSON.stringify(body[f.key] || []) : body[f.key]));

    const result = await db.prepare(`INSERT INTO ${table} (${colList}) VALUES (${placeholders})`).run(...values);
    res.status(201).json({ item: serialize(await get.get(result.lastInsertRowid)) });
  }));

  router.put('/:id', requireAuth, requireAdmin, ah(async (req, res) => {
    const body = req.body || {};
    const present = fields.filter((f) => body[f.key] !== undefined);
    if (!present.length) return res.status(400).json({ error: 'No fields provided.' });

    const setClause = present.map((f) => `"${f.col}" = ?`).join(', ');
    const values = present.map((f) => (f.array ? JSON.stringify(body[f.key] || []) : body[f.key]));

    const info = await db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`).run(...values, req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Not found.' });
    res.json({ item: serialize(await get.get(req.params.id)) });
  }));

  router.delete('/:id', requireAuth, requireAdmin, ah(async (req, res) => {
    const row = await get.get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found.' });
    // Awaited — some beforeDelete callbacks (packs) read rows that a FK
    // cascade would wipe out the moment the delete below runs.
    await beforeDelete?.(row);
    await db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
    res.status(204).end();
  }));

  return router;
}
