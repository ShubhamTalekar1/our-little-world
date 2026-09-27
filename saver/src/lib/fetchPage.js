// Network side of saving a link. A browser can't read other sites' HTML
// directly (CORS), so pages go through a proxy: your own first (see
// worker/proxy.js), then public ones. Everything degrades gracefully —
// a save always works, it just may need a title typed by hand.

import { extractPage } from './extract.js';
import { classify, autoTags } from './classify.js';
import { isVideoUrl, placeFromMapUrl, videoEmbedUrl, videoThumbnail } from './links.js';

export const PUBLIC_PROXIES = [
  'https://api.allorigins.win/raw?url={url}',
  'https://corsproxy.io/?url={url}',
];

const withTimeout = (ms) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(t) };
};

async function getText(url, ms = 12000) {
  const { signal, done } = withTimeout(ms);
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    done();
  }
}

async function getJson(url, ms = 10000) {
  return JSON.parse(await getText(url, ms));
}

export function proxyList(settings = {}) {
  const own = (settings.proxy || '').trim();
  const list = own ? [own.includes('{url}') ? own : own.replace(/\/?$/, '/?url={url}')] : [];
  return settings.usePublicProxies === false ? list : [...list, ...PUBLIC_PROXIES];
}

export async function fetchHtml(url, settings) {
  let lastErr;
  for (const tpl of proxyList(settings)) {
    try {
      const html = await getText(tpl.replace('{url}', encodeURIComponent(url)));
      if (/<(html|head|meta|title)[\s>]/i.test(html)) return html;
      lastErr = new Error('Not an HTML page');
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('No proxy configured');
}

/** noembed speaks CORS and knows YouTube, Vimeo, TikTok and friends. */
async function fetchOEmbed(url) {
  try {
    const d = await getJson(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    if (d.error) return null;
    return { title: d.title || '', siteName: d.provider_name || '', image: d.thumbnail_url || '', author: d.author_name || '' };
  } catch {
    return null;
  }
}

/** Last resort for a preview when every proxy fails: Microlink's free metadata API (CORS-enabled). */
async function fetchMicrolink(url) {
  try {
    const d = await getJson(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
    if (d.status !== 'success') return null;
    const x = d.data || {};
    return { title: x.title || '', description: x.description || '', image: x.image?.url || '', siteName: x.publisher || '' };
  } catch {
    return null;
  }
}

/** Address or place name → coordinates, via OpenStreetMap's Nominatim. */
export async function geocode(query) {
  if (!query?.trim()) return null;
  const d = await getJson(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query.trim())}`
  );
  if (!d?.[0]) return null;
  return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon), address: d[0].display_name };
}

const parseHtml = (html) => new DOMParser().parseFromString(html, 'text/html');

/**
 * Everything we can learn about a link. Never throws: on total failure it
 * returns { ok: false } with whatever the URL alone told us.
 */
export async function enrichUrl(url, settings = {}) {
  const fromUrl = placeFromMapUrl(url);
  let page = null;
  let error = null;

  const [html, oembed] = await Promise.all([
    fetchHtml(url, settings).catch((e) => {
      error = e;
      return null;
    }),
    isVideoUrl(url) ? fetchOEmbed(url) : null,
  ]);
  if (html) {
    try {
      page = extractPage(parseHtml(html), url);
    } catch (e) {
      error = e;
    }
  }
  // Login walls and bot checks return HTML with no useful title.
  const weak = !page?.title || /^(just a moment|access denied|attention required|log ?in|sign ?in|instagram|tiktok)\b/i.test(page.title);
  const micro = weak && !oembed ? await fetchMicrolink(url) : null;

  const base = { title: '', description: '', image: '', siteName: '', recipe: null, place: null, book: null, kinds: [] };
  const info = { ...base, ...(page || {}) };
  for (const extra of [micro, oembed]) {
    if (!extra) continue;
    if (weak && extra.title) info.title = extra.title;
    info.description ||= extra.description || '';
    info.image ||= extra.image || '';
    info.siteName ||= extra.siteName || '';
  }
  info.image ||= videoThumbnail(url) || '';

  if (fromUrl && (fromUrl.lat != null || fromUrl.name)) {
    info.place = { ...(info.place || {}), ...fromUrl, name: info.place?.name || fromUrl.name || '' };
    if (!info.title || weak) info.title = fromUrl.name || info.title;
  }

  const kind = classify(url, info);
  // Places without coordinates get geocoded from their address or name.
  if (kind === 'place' && info.place?.lat == null) {
    const q = info.place?.address || info.place?.name || (fromUrl ? fromUrl.name : '');
    if (q) {
      const g = await geocode(q).catch(() => null);
      if (g) info.place = { ...(info.place || {}), lat: g.lat, lng: g.lng, address: info.place?.address || g.address };
    }
  }

  return {
    ok: Boolean(page || micro || oembed || fromUrl?.lat != null),
    error: error ? String(error.message || error) : null,
    kind,
    title: info.title,
    description: info.description,
    image: info.image,
    siteName: info.siteName,
    recipe: info.recipe,
    place: info.place,
    author: info.book?.author || oembed?.author || '',
    embedUrl: videoEmbedUrl(url),
    tags: autoTags(info),
  };
}
