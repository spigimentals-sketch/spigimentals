import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { hashPassword, verifyPassword, signToken, requireAuth } from '../auth.js';
import { ah } from '../lib/asyncHandler.js';
import { getProfile } from './profile.js';

export const authRouter = Router();

authRouter.post('/signup', ah(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!email?.trim() || !password || password.length < 6) {
    return res.status(400).json({ error: 'Email and a password of at least 6 characters are required.' });
  }
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) return res.status(400).json({ error: 'An account with this email already exists.' });

  const id = randomUUID();
  const passwordHash = await hashPassword(password);
  const displayName = (name || '').trim() || normalizedEmail.split('@')[0];

  await db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(id, normalizedEmail, passwordHash);
  await db.prepare('INSERT INTO profiles (id, email, name) VALUES (?, ?, ?)').run(id, normalizedEmail, displayName);

  const token = signToken(id);
  res.status(201).json({ token, user: { id, email: normalizedEmail }, profile: await getProfile(id) });
}));

authRouter.post('/signin', ah(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email?.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const normalizedEmail = email.trim().toLowerCase();

  const user = await db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(normalizedEmail);
  const ok = user ? await verifyPassword(password, user.password_hash) : false;
  if (!ok) return res.status(400).json({ error: 'Invalid email or password.' });

  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, email: user.email }, profile: await getProfile(user.id) });
}));

authRouter.get('/session', requireAuth, ah(async (req, res) => {
  const user = await db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(401).json({ error: 'Not signed in.' });
  res.json({ user, profile: await getProfile(req.userId) });
}));
