import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireAdmin } from '../auth.js';
import { handleUpload } from '../lib/upload.js';
import { uploadBuffer, removeCloudinaryFile } from '../lib/cloudinary.js';
import { ah } from '../lib/asyncHandler.js';

const toCamel = (col) => col.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

// One file per row, stored in a single DB column — used for track/beat audio
// and cover art. `table`, `column`, and `folder` come only from index.js's
// own config (never request input), so interpolating them into SQL/paths
// here is safe. `resourceType` is Cloudinary's 'image' or 'video' (Cloudinary
// files audio under 'video').
export function createSingleFileRouter(table, column, folder, uploadMiddleware, fieldLabel, resourceType) {
  const router = Router({ mergeParams: true });
  const responseKey = toCamel(column);

  router.post('/', requireAuth, requireAdmin, handleUpload(uploadMiddleware), ah(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: `No ${fieldLabel} file provided.` });

    const row = await db.prepare(`SELECT ${column} FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found.' });

    let result;
    try {
      result = await uploadBuffer(req.file.buffer, { folder, resourceType });
    } catch (err) {
      return res.status(502).json({ error: `Upload to storage failed: ${err.message}` });
    }

    if (row[column]) removeCloudinaryFile(row[column], resourceType); // replacing — drop the old file, fire-and-forget

    await db.prepare(`UPDATE ${table} SET ${column} = ? WHERE id = ?`).run(result.secure_url, req.params.id);
    res.status(201).json({ [responseKey]: result.secure_url });
  }));

  router.delete('/', requireAuth, requireAdmin, ah(async (req, res) => {
    const row = await db.prepare(`SELECT ${column} FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found.' });
    if (row[column]) await removeCloudinaryFile(row[column], resourceType);
    await db.prepare(`UPDATE ${table} SET ${column} = NULL WHERE id = ?`).run(req.params.id);
    res.status(204).end();
  }));

  return router;
}
