// Tiny colour helpers used by the SVG renderers.
const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));

function parse(hex) {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

const toHex = (r, g, b) => '#' + [r, g, b].map((n) => clamp(n).toString(16).padStart(2, '0')).join('');

/** Darken (amt < 0) or lighten (amt > 0) a hex colour. amt in [-1, 1]. */
export function shade(hex, amt) {
  const [r, g, b] = parse(hex);
  if (amt < 0) return toHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
  return toHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
}

/** Mix two hex colours. t = 0 → a, t = 1 → b */
export function mix(a, b, t) {
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export function isLight(hex) {
  const [r, g, b] = parse(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}
