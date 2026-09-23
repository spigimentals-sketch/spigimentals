import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { ah } from './lib/asyncHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
if (!process.env.JWT_SECRET) {
  console.warn('[Auth] JWT_SECRET not set — using an insecure dev default. Set it in server/.env for anything beyond local dev.');
}
const TOKEN_TTL = '30d';

export const hashPassword = (password) => bcrypt.hash(password, 10);
export const verifyPassword = (password, hash) => bcrypt.compare(password, hash);

export const signToken = (userId) => jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });

function readToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Attaches req.userId when a valid token is present; never rejects the request.
export function optionalAuth(req, _res, next) {
  const payload = readToken(req);
  req.userId = payload?.sub || null;
  next();
}

// Rejects the request with 401 unless a valid token is present.
export function requireAuth(req, res, next) {
  const payload = readToken(req);
  if (!payload) return res.status(401).json({ error: 'Not signed in.' });
  req.userId = payload.sub;
  next();
}

// Must run after requireAuth. Checks admin status fresh from the DB on every
// request (not cached in the token), so revoking admin takes effect immediately.
// Wrapped in ah() here (not at each call site) since Express 4 won't catch a
// rejected promise from async middleware on its own.
export const requireAdmin = ah(async (req, res, next) => {
  const row = await db.prepare('SELECT is_admin FROM profiles WHERE id = ?').get(req.userId);
  if (!row?.is_admin) return res.status(403).json({ error: 'Admin access required.' });
  next();
});
