// Shared coordinates for the 200×300 avatar canvas.
// The head is intentionally large — a soft chibi proportion reads as warm and
// expressive at small sizes (chat bubbles, header) as well as large.

export const HEAD = { cx: 100, cy: 86, top: 42, bottom: 130 };
export const EYES = { y: 93, lx: 82, rx: 118 };

export function bodyDims(bodyType = 'average') {
  switch (bodyType) {
    case 'slim':
      return { sw: 26, ww: 20, hw: 22 };
    case 'soft':
      return { sw: 31, ww: 27, hw: 30 };
    default:
      return { sw: 29, ww: 23, hw: 25 };
  }
}

export function headPath(shape = 'round') {
  switch (shape) {
    case 'oval':
      return 'M60,84 C60,56 78,42 100,42 C122,42 140,56 140,84 C140,112 124,132 100,132 C76,132 60,112 60,84 Z';
    case 'heart':
      return 'M56,80 C56,52 76,42 100,42 C124,42 144,52 144,80 C144,104 124,126 100,131 C76,126 56,104 56,80 Z';
    case 'square':
      return 'M57,74 C57,50 76,42 100,42 C124,42 143,50 143,74 L143,100 C143,120 124,130 100,130 C76,130 57,120 57,100 Z';
    default:
      return 'M56,86 C56,58 76,42 100,42 C124,42 144,58 144,86 C144,112 124,130 100,130 C76,130 56,112 56,86 Z';
  }
}

export function torsoPath({ sw, ww }) {
  return `M${100 - sw},152 Q${100 - sw},140 ${100 - sw + 11},139 L${100 + sw - 11},139 Q${100 + sw},140 ${100 + sw},152 L${100 + ww},198 L${100 - ww},198 Z`;
}

export function hipPath({ ww, hw }) {
  return `M${100 - ww},194 L${100 + ww},194 L${100 + hw},214 L${100 - hw},214 Z`;
}

/** Leg outline from `top` to `bottom` y; side = -1 left, 1 right. */
export function legPath({ hw }, side, top = 208, bottom = 268) {
  const outerTop = 100 + side * hw;
  const innerTop = 100 + side * 1.5;
  const outerBot = 100 + side * (hw - 8);
  const innerBot = 100 + side * 3.5;
  // interpolate x at `bottom` for shorter garments
  const t = (bottom - 208) / 60;
  const ob = outerTop + (outerBot - outerTop) * t;
  const ib = innerTop + (innerBot - innerTop) * t;
  return `M${outerTop},${top} L${innerTop},${top} L${ib},${bottom} L${ob},${bottom} Z`;
}

export function footCenter({ hw }, side) {
  return 100 + side * (hw / 2 + 3);
}

export function shoulder({ sw }, side) {
  return { x: 100 + side * (sw - 5), y: 147 };
}
