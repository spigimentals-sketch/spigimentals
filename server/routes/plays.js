import { Router } from 'express';
import { db } from '../db.js';

// Public play-count bump — fired when a track/beat actually starts playing.
// `table` comes only from index.js's own config (never request input).
export function createPlaysRouter(table) {
  const router = Router({ mergeParams: true });

  router.post('/', (req, res) => {
    const info = db.prepare(`UPDATE ${table} SET play_count = play_count + 1 WHERE id = ?`).run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Not found.' });
    res.status(204).end();
  });

  return router;
}
