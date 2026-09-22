// Pulls the 11-char video ID out of any common YouTube URL shape, including
// the already-normalized embed form.
const extractYoutubeId = (url) => {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:embed\/|shorts\/)|youtu\.be\/|[?&]v=)([a-zA-Z0-9_-]+)/
  );
  return match ? match[1] : null;
};

// Normalize various YouTube URL formats into an embed URL — mirrors
// lib/spotify.js's normalizeSpotifyUrl. Embedding the real youtube.com/embed
// player (rather than just linking out) is what makes plays on the site
// count toward the video's YouTube view count.
export const normalizeYoutubeUrl = (url) => {
  const id = extractYoutubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
};

// YouTube serves a thumbnail for every uploaded video at this fixed path —
// used as the catalog card art when a track has a YouTube link but no
// separately-uploaded cover image.
export const getYoutubeThumbnail = (url) => {
  const id = extractYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};
