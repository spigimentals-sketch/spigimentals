import { v2 as cloudinary } from 'cloudinary';

// CLOUDINARY_URL (cloudinary://key:secret@cloud_name) configures this
// automatically if set; these three cover the case where it's set as
// separate vars instead. Required for any deploy target with no local disk.
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Uploads a Buffer (from multer's memory storage) straight to Cloudinary —
// no file ever touches local disk, so this works on hosts with ephemeral
// filesystems. `resourceType` is 'image' for cover art or 'video' (which is
// also what Cloudinary uses for audio) for audio files.
export function uploadBuffer(buffer, { folder, resourceType }) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: resourceType }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}

// Cloudinary URLs look like:
// https://res.cloudinary.com/<cloud>/<resourceType>/upload/v169.../<folder>/<publicId>.<ext>
// The public_id (needed to delete) is everything after "upload/v<digits>/"
// minus the file extension.
function extractPublicId(url) {
  const match = url?.match(/\/upload\/v\d+\/(.+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
}

export async function removeCloudinaryFile(url, resourceType) {
  const publicId = extractPublicId(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch {
    // already gone, or Cloudinary not configured (e.g. local dev) — fine to ignore
  }
}
