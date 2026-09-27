// URL helpers that need no network: finding links in shared text,
// recognising video/map hosts, and reading coordinates out of map links.

const URL_RE = /https?:\/\/[^\s<>"'`]+/i;

/** Pull the first http(s) URL out of free text (share sheets often send "Title https://…"). */
export function findUrl(text) {
  if (!text) return null;
  const m = String(text).match(URL_RE);
  if (!m) return null;
  // Trailing punctuation is almost never part of the link.
  return m[0].replace(/[),.;:!?\]]+$/, '');
}

export function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\.|^m\./, '').toLowerCase();
  } catch {
    return '';
  }
}

export function hostMatches(url, domains) {
  const host = hostOf(url);
  return domains.some((d) => host === d || host.endsWith('.' + d));
}

export const VIDEO_HOSTS = ['youtube.com', 'youtu.be', 'vimeo.com', 'tiktok.com', 'twitch.tv', 'dailymotion.com'];
export const MAP_HOSTS = ['maps.google.com', 'maps.app.goo.gl', 'goo.gl', 'maps.apple.com', 'openstreetmap.org', 'osm.org', 'waze.com'];

export function isMapUrl(url) {
  if (hostMatches(url, MAP_HOSTS)) return true;
  try {
    const u = new URL(url);
    return /(^|\.)google\.[a-z.]+$/.test(u.hostname) && u.pathname.startsWith('/maps');
  } catch {
    return false;
  }
}

export function isInstagramReel(url) {
  return hostMatches(url, ['instagram.com']) && /\/(reel|reels|tv)\//.test(url);
}

export function isVideoUrl(url) {
  return hostMatches(url, VIDEO_HOSTS) || isInstagramReel(url);
}

export function youtubeId(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    if (host.endsWith('youtube.com')) {
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      const m = u.pathname.match(/^\/(shorts|embed|live)\/([\w-]{6,})/);
      if (m) return m[2];
    }
  } catch {
    /* not a URL */
  }
  return null;
}

/** An iframe-able URL for the video, when the host allows embedding. */
export function videoEmbedUrl(url) {
  const yt = youtubeId(url);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt}`;
  try {
    const u = new URL(url);
    if (hostMatches(url, ['vimeo.com'])) {
      const id = u.pathname.split('/').find((p) => /^\d+$/.test(p));
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    if (hostMatches(url, ['tiktok.com'])) {
      const m = u.pathname.match(/\/video\/(\d+)/);
      if (m) return `https://www.tiktok.com/embed/v2/${m[1]}`;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function videoThumbnail(url) {
  const yt = youtubeId(url);
  return yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : null;
}

const validCoord = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);

function pair(str) {
  const m = String(str || '').match(/(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  return validCoord(lat, lng) ? { lat, lng } : null;
}

/**
 * Read a place out of a map link without fetching it.
 * Returns { lat?, lng?, name? } or null.
 */
export function placeFromMapUrl(url) {
  if (!isMapUrl(url)) return null;
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const decoded = decodeURIComponent(u.pathname + u.search + u.hash).replace(/\+/g, ' ');
  let coords = null;

  // Google: the pin itself lives in !3d<lat>!4d<lng>; @lat,lng is the viewport centre.
  const pin = decoded.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (pin && validCoord(+pin[1], +pin[2])) coords = { lat: +pin[1], lng: +pin[2] };
  if (!coords) {
    const at = decoded.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (at && validCoord(+at[1], +at[2])) coords = { lat: +at[1], lng: +at[2] };
  }
  for (const key of ['q', 'query', 'll', 'sll', 'daddr', 'destination', 'center']) {
    if (coords) break;
    coords = pair(u.searchParams.get(key));
  }
  if (!coords && u.searchParams.get('mlat')) {
    const lat = +u.searchParams.get('mlat');
    const lng = +u.searchParams.get('mlon');
    if (validCoord(lat, lng)) coords = { lat, lng };
  }
  if (!coords && u.hash) coords = pair(u.hash.replace(/^#map=\d+\//, '').replace('/', ','));

  let name = null;
  const placePath = u.pathname.match(/\/maps\/(?:place|search)\/([^/@]+)/);
  if (placePath) name = decodeURIComponent(placePath[1]).replace(/\+/g, ' ');
  for (const key of ['q', 'query', 'name', 'address', 'daddr']) {
    if (name) break;
    const v = u.searchParams.get(key);
    if (v && !pair(v)) name = v;
  }

  if (!coords && !name) return {};
  return { ...(coords || {}), ...(name ? { name: name.trim() } : {}) };
}
