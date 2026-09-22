import multer from 'multer';

const AUDIO_MIME = new Set([
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave',
  'audio/ogg', 'audio/flac', 'audio/aac', 'audio/mp4', 'audio/x-m4a', 'audio/webm',
]);

const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function audioFileFilter(_req, file, cb) {
  if (!AUDIO_MIME.has(file.mimetype)) {
    return cb(new Error('Only audio files are allowed (mp3, wav, ogg, flac, aac, m4a).'));
  }
  cb(null, true);
}

function imageFileFilter(_req, file, cb) {
  if (!IMAGE_MIME.has(file.mimetype)) {
    return cb(new Error('Only image files are allowed (jpg, png, webp, gif).'));
  }
  cb(null, true);
}

const MAX_SIZE = 100 * 1024 * 1024; // 100MB — generous for uncompressed WAV stems
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB — plenty for cover art

// Files land in memory (req.file.buffer / req.file[i].buffer), never on
// local disk — the route handlers upload that buffer straight to Cloudinary.
// This is what makes the server deployable on hosts with no persistent disk.
export const uploadTrackAudio = multer({ storage: multer.memoryStorage(), fileFilter: audioFileFilter, limits: { fileSize: MAX_SIZE } }).single('audio');
export const uploadBeatAudio = multer({ storage: multer.memoryStorage(), fileFilter: audioFileFilter, limits: { fileSize: MAX_SIZE } }).single('audio');
export const uploadTrackCover = multer({ storage: multer.memoryStorage(), fileFilter: imageFileFilter, limits: { fileSize: MAX_IMAGE_SIZE } }).single('cover');
export const uploadBeatCover = multer({ storage: multer.memoryStorage(), fileFilter: imageFileFilter, limits: { fileSize: MAX_IMAGE_SIZE } }).single('cover');
export const uploadPackSamples = multer({ storage: multer.memoryStorage(), fileFilter: audioFileFilter, limits: { fileSize: MAX_SIZE } }).array('samples', 20);

// Wraps a multer middleware so validation/size errors come back as a clean
// 400 instead of falling through to the generic 500 handler in index.js.
export function handleUpload(middleware) {
  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message || 'Upload failed.' });
      next();
    });
  };
}
