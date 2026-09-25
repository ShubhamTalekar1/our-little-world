// Film posters, painted on a canvas so the same art works on the Now Showing
// page (as an image) and on the lobby walls of the 3D theatre (as a texture).

// [sky top, sky bottom, sun/moon, hills, ink]
export const POSTER_PALETTES = [
  ['#1b1d3a', '#6b4a7a', '#f2c98b', '#2a1f3d', '#f5ebdd'], // dusk
  ['#0f2a3a', '#3f7d8c', '#f5ebdd', '#12303b', '#f5ebdd'], // sea
  ['#2f5d3a', '#e8d27a', '#fff3c4', '#3d6b3f', '#fffaf0'], // meadow
  ['#3a0f1a', '#b8434f', '#ffd1a1', '#2a0a12', '#fff0e4'], // crimson
  ['#10101a', '#2d3f63', '#8fb3d9', '#0b0b14', '#e6eeff'], // midnight
  ['#2b2233', '#b8664a', '#f2c98b', '#241a24', '#fff1e0'], // ember
  ['#f2d7c9', '#e8b4a0', '#ffffff', '#b77a6b', '#3a2328'], // blush
  ['#1a2b1f', '#6e8f5a', '#e7f0c9', '#15241a', '#f3f7e6'], // forest
  ['#231942', '#9f86c0', '#e0b1cb', '#1b1233', '#fbf5ff'], // lilac
  ['#0e1f2f', '#ce6a4e', '#ffcf7a', '#0b1823', '#fff5e6'], // neon
  ['#3b3e4c', '#8fb3d9', '#f5ebdd', '#2b2d38', '#ffffff'], // rain
  ['#161616', '#474747', '#e9e9e9', '#0d0d0d', '#f4f4f4'], // noir
];

export const W = 600;
export const H = 900;

const hash = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
function rng(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function wrap(g, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

const loadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

async function fontsReady() {
  try {
    await Promise.all([document.fonts.load('600 80px Fraunces'), document.fonts.load('italic 400 30px Fraunces'), document.fonts.load('500 20px "DM Sans"')]);
  } catch {
    /* system fonts are fine */
  }
}

/** Paint a poster for `film` ({ title, tagline, genre, palette, poster, startsAt }). */
export async function paintPoster(film) {
  await fontsReady();
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  const [top, bottom, sun, hills, ink] = POSTER_PALETTES[(film.palette ?? 0) % POSTER_PALETTES.length];
  const rand = rng(hash(film.title));

  const photo = film.poster ? await loadImage(film.poster) : null;
  if (photo) {
    // Cover-fit the uploaded image.
    const s = Math.max(W / photo.width, H / photo.height);
    g.drawImage(photo, (W - photo.width * s) / 2, (H - photo.height * s) / 2, photo.width * s, photo.height * s);
    const shade = g.createLinearGradient(0, H * 0.35, 0, H);
    shade.addColorStop(0, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,0,0,0.88)');
    g.fillStyle = shade;
    g.fillRect(0, 0, W, H);
  } else {
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, top);
    sky.addColorStop(0.72, bottom);
    sky.addColorStop(1, hills);
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);
    // stars
    g.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 70; i++) {
      const r = rand() * 1.6 + 0.3;
      g.globalAlpha = 0.25 + rand() * 0.6;
      g.beginPath();
      g.arc(rand() * W, rand() * H * 0.55, r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    // sun / moon with a soft halo
    const cx = W * (0.3 + rand() * 0.4);
    const cy = H * (0.26 + rand() * 0.12);
    const halo = g.createRadialGradient(cx, cy, 10, cx, cy, 260);
    halo.addColorStop(0, `${sun}aa`);
    halo.addColorStop(1, `${sun}00`);
    g.fillStyle = halo;
    g.fillRect(0, 0, W, H);
    g.fillStyle = sun;
    g.beginPath();
    g.arc(cx, cy, 70 + rand() * 40, 0, Math.PI * 2);
    g.fill();
    // layered hills
    for (let layer = 0; layer < 3; layer++) {
      const base = H * (0.52 + layer * 0.08);
      g.fillStyle = hills;
      g.globalAlpha = 0.45 + layer * 0.25;
      g.beginPath();
      g.moveTo(0, H);
      const f1 = 1 + rand() * 2;
      const f2 = 3 + rand() * 3;
      const p = rand() * 6;
      for (let x = 0; x <= W; x += 10) g.lineTo(x, base - Math.sin((x / W) * Math.PI * f1 + p) * 40 - Math.sin((x / W) * Math.PI * f2) * 14);
      g.lineTo(W, H);
      g.fill();
    }
    g.globalAlpha = 1;
    // two tiny figures on the ridge, watching the sky
    const fx = W * 0.62;
    const fy = H * 0.66;
    g.fillStyle = hills;
    for (const dx of [0, 26]) {
      g.beginPath();
      g.arc(fx + dx, fy - 30, 9, 0, Math.PI * 2);
      g.fill();
      g.fillRect(fx + dx - 8, fy - 22, 16, 26);
    }
    const fade = g.createLinearGradient(0, H * 0.6, 0, H);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(1, 'rgba(0,0,0,0.55)');
    g.fillStyle = fade;
    g.fillRect(0, 0, W, H);
  }

  // film grain
  try {
    const grain = g.getImageData(0, 0, W, H);
    for (let i = 0; i < grain.data.length; i += 4 * 3) {
      const n = (rand() - 0.5) * 18;
      grain.data[i] += n;
      grain.data[i + 1] += n;
      grain.data[i + 2] += n;
    }
    g.putImageData(grain, 0, 0);
  } catch {
    /* a cross-origin image would block pixel access; skip the grain */
  }

  // studio line
  g.fillStyle = ink;
  g.globalAlpha = 0.75;
  g.font = '500 17px "DM Sans", system-ui, sans-serif';
  g.textAlign = 'center';
  g.letterSpacing = '6px';
  g.fillText('OUR LITTLE WORLD PICTURES', W / 2, 54);
  g.globalAlpha = 1;
  g.letterSpacing = '0px';

  // title
  let size = 92;
  g.font = `600 ${size}px Fraunces, Georgia, serif`;
  let lines = wrap(g, film.title, W - 90);
  while ((lines.length > 3 || lines.some((l) => g.measureText(l).width > W - 70)) && size > 40) {
    size -= 6;
    g.font = `600 ${size}px Fraunces, Georgia, serif`;
    lines = wrap(g, film.title, W - 90);
  }
  const titleBottom = H - 150;
  g.shadowColor = 'rgba(0,0,0,0.45)';
  g.shadowBlur = 18;
  lines.forEach((l, i) => g.fillText(l, W / 2, titleBottom - (lines.length - 1 - i) * size * 1.02));
  g.shadowBlur = 0;

  if (film.tagline) {
    g.font = 'italic 400 25px Fraunces, Georgia, serif';
    g.globalAlpha = 0.9;
    const tl = wrap(g, film.tagline, W - 120).slice(0, 2);
    const titleTop = titleBottom - (lines.length - 1) * size * 1.02 - size * 0.85;
    tl.forEach((l, i) => g.fillText(l, W / 2, titleTop - 22 - (tl.length - 1 - i) * 31));
    g.globalAlpha = 1;
  }

  // billing block
  g.font = '500 14px "DM Sans", system-ui, sans-serif';
  g.globalAlpha = 0.6;
  g.letterSpacing = '2px';
  g.fillText(`${(film.genre || 'A FEATURE').toUpperCase()}  ·  STARRING THE TWO OF US  ·  SCREEN 1`, W / 2, H - 92);
  g.letterSpacing = '0px';
  g.globalAlpha = 1;
  if (film.startsAt) {
    const d = new Date(film.startsAt);
    const label = `${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    g.font = '600 20px "DM Sans", system-ui, sans-serif';
    const w = g.measureText(label).width + 40;
    g.fillStyle = sun;
    g.beginPath();
    g.roundRect((W - w) / 2, H - 70, w, 38, 19);
    g.fill();
    g.fillStyle = top;
    g.fillText(label, W / 2, H - 44);
  } else {
    g.font = '600 18px "DM Sans", system-ui, sans-serif';
    g.fillStyle = sun;
    g.letterSpacing = '5px';
    g.fillText('NOW SHOWING', W / 2, H - 46);
    g.letterSpacing = '0px';
  }
  return c;
}

const cache = new Map();
const keyOf = (f) => [f.title, f.tagline, f.genre, f.palette, f.poster, f.startsAt].join('|');

/** Cached poster canvas + data URL. */
export function getPoster(film) {
  const k = keyOf(film);
  if (!cache.has(k)) {
    cache.set(
      k,
      paintPoster(film).then((canvas) => ({ canvas, url: canvas.toDataURL('image/jpeg', 0.86) })),
    );
  }
  return cache.get(k);
}
