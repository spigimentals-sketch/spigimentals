// Bootstraps the first admin account. Not exposed over HTTP on purpose —
// granting admin has to be a deliberate local/operator action, never
// self-serve through the API. Usage: npm run make-admin -- you@example.com
import { db } from '../db.js';

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: npm run make-admin -- you@example.com');
  process.exit(1);
}

const info = db.prepare('UPDATE profiles SET is_admin = 1 WHERE email = ?').run(email);
if (info.changes === 0) {
  console.error(`No profile found for ${email}. Sign up on the site first, then run this again.`);
  process.exit(1);
}

console.log(`${email} is now an admin. They may need to sign out and back in for it to take effect.`);
