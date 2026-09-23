import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { ah } from '../lib/asyncHandler.js';

export const profileRouter = Router();

export function serializeProfile(row) {
  if (!row) return null;
  return {
    ...row,
    tutor_badge: !!row.tutor_badge,
    is_admin: !!row.is_admin,
    enrolled_courses: JSON.parse(row.enrolled_courses || '[]'),
  };
}

export async function getProfile(userId) {
  const row = await db.prepare('SELECT * FROM profiles WHERE id = ?').get(userId);
  return serializeProfile(row);
}

const PATCHABLE_FIELDS = ['name', 'profile_pic', 'country', 'residence'];

profileRouter.patch('/', requireAuth, ah(async (req, res) => {
  const patch = req.body || {};
  const fields = Object.keys(patch).filter((k) => PATCHABLE_FIELDS.includes(k));
  if (fields.length === 0) return res.status(400).json({ error: 'No updatable fields provided.' });

  const setClause = fields.map((f) => `${f} = ?`).join(', ');
  const values = fields.map((f) => patch[f]);
  await db.prepare(`UPDATE profiles SET ${setClause}, updated_at = datetime('now') WHERE id = ?`).run(...values, req.userId);

  res.json({ profile: await getProfile(req.userId) });
}));
