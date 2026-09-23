import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { db } from './db.js';
import { seedIfEmpty } from './seed.js';
import { RESOURCES } from './resources.js';
import { createResourceRouter } from './routes/resource.js';
import { authRouter } from './routes/auth.js';
import { profileRouter } from './routes/profile.js';
import { cartRouter } from './routes/cart.js';
import { bookingsRouter } from './routes/bookings.js';
import { createSingleFileRouter } from './routes/singleAudio.js';
import { createPlaysRouter } from './routes/plays.js';
import { visitsRouter } from './routes/visits.js';
import { packFilesRouter } from './routes/packFiles.js';
import { removeCloudinaryFile } from './lib/cloudinary.js';
import { uploadTrackAudio, uploadBeatAudio, uploadTrackCover, uploadBeatCover } from './lib/upload.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

await seedIfEmpty();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/cart', cartRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/tracks/:id/audio', createSingleFileRouter('tracks', 'audio_url', 'tracks', uploadTrackAudio, 'audio', 'video'));
app.use('/api/beats/:id/audio', createSingleFileRouter('beats', 'audio_url', 'beats', uploadBeatAudio, 'audio', 'video'));
app.use('/api/tracks/:id/cover', createSingleFileRouter('tracks', 'cover_url', 'covers/tracks', uploadTrackCover, 'cover', 'image'));
app.use('/api/beats/:id/cover', createSingleFileRouter('beats', 'cover_url', 'covers/beats', uploadBeatCover, 'cover', 'image'));
app.use('/api/tracks/:id/play', createPlaysRouter('tracks'));
app.use('/api/beats/:id/play', createPlaysRouter('beats'));
app.use('/api/visits', visitsRouter);
app.use('/api/packs/:packId/files', packFilesRouter);

// Cleans up the Cloudinary file when its owning row is deleted — the FK
// cascade on pack_files only removes DB rows, not the remote files.
const RESOURCE_OPTIONS = {
  tracks: {
    beforeDelete: (row) => {
      removeCloudinaryFile(row.audio_url, 'video');
      removeCloudinaryFile(row.cover_url, 'image');
    },
  },
  beats: {
    beforeDelete: (row) => {
      removeCloudinaryFile(row.audio_url, 'video');
      removeCloudinaryFile(row.cover_url, 'image');
    },
  },
  packs: {
    beforeDelete: async (row) => {
      const files = await db.prepare('SELECT url FROM pack_files WHERE pack_id = ?').all(row.id);
      for (const f of files) removeCloudinaryFile(f.url, 'video');
    },
  },
};
for (const [name, resource] of Object.entries(RESOURCES)) {
  app.use(`/api/${name}`, createResourceRouter(resource.table, resource.fields, RESOURCE_OPTIONS[name]));
}

// In production this same server also serves the built frontend (`npm run
// build` in the project root outputs to ../dist) — one deployed service,
// one URL, no CORS to configure between separate frontend/backend hosts.
const distDir = join(__dirname, '..', 'dist');
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(join(distDir, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[Spigimentals API] listening on http://localhost:${PORT}`));
