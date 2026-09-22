// normalize various Spotify URL formats into an embed URL
export const normalizeSpotifyUrl = (url) => {
  if (!url) return null;
  try {
    if (url.includes('open.spotify.com/embed')) return url;
    const colonMatch = url.match(/spotify:track:([a-zA-Z0-9]+)/);
    if (colonMatch) return `https://open.spotify.com/embed/track/${colonMatch[1]}`;
    const trackMatch = url.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
    if (trackMatch) return `https://open.spotify.com/embed/track/${trackMatch[1]}`;
    const idMatch = url.match(/track\/([a-zA-Z0-9]+)/);
    if (idMatch) return `https://open.spotify.com/embed/track/${idMatch[1]}`;
  } catch (e) {
    return null;
  }
  return null;
};
