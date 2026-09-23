import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdmin } from '../auth.js';
import { uploadPackSamples, handleUpload } from '../lib/upload.js';
import { uploadBuffer, removeCloudinaryFile } from '../lib/cloudinary.js';
import { ah } from '../lib/asyncHandler.js';

export const packFilesRouter = Router({ mergeParams: true });

const serialize = (row) => ({ id: row.id, filename: row.filename, url: row.url });

packFilesRouter.get('/', ah(async (req, res) => {
  const rows = await db.prepare('SELECT * FROM pack_files WHERE pack_id = ? ORDER BY id').all(req.params.packId);
  res.json({ items: rows.map(serialize) });
}));

packFilesRouter.post('/', requireAuth, requireAdmin, handleUpload(uploadPackSamples), ah(async (req, res) => {
  const pack = await db.prepare('SELECT id FROM packs WHERE id = ?').get(req.params.packId);
  if (!pack) return res.status(404).json({ error: 'Pack not found.' });

  const files = req.files || [];
  if (!files.length) return res.status(400).json({ error: 'No sample files provided.' });

  let uploaded;
  try {
    uploaded = await Promise.all(
      files.map((f) => uploadBuffer(f.buffer, { folder: `packs/${req.params.packId}`, resourceType: 'video' }))
    );
  } catch (err) {
    return res.status(502).json({ error: `Upload to storage failed: ${err.message}` });
  }

  const insert = db.prepare('INSERT INTO pack_files (pack_id, filename, url) VALUES (?, ?, ?)');
  const items = [];
  for (let i = 0; i < files.length; i++) {
    const url = uploaded[i].secure_url;
    const result = await insert.run(req.params.packId, files[i].originalname, url);
    items.push(serialize({ id: result.lastInsertRowid, filename: files[i].originalname, url }));
  }
  res.status(201).json({ items });
}));

packFilesRouter.delete('/:fileId', requireAuth, requireAdmin, ah(async (req, res) => {
  const row = await db.prepare('SELECT * FROM pack_files WHERE id = ? AND pack_id = ?').get(req.params.fileId, req.params.packId);
  if (!row) return res.status(404).json({ error: 'Not found.' });
  await removeCloudinaryFile(row.url, 'video');
  await db.prepare('DELETE FROM pack_files WHERE id = ?').run(req.params.fileId);
  res.status(204).end();
}));
