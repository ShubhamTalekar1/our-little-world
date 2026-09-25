import * as THREE from 'three';
import { CLOTHING_BY_ID, HEIGHTS } from '../../../catalog/avatarItems';
import { shade } from '../../../lib/color';
import { toon, flat, shiny, OUTLINE } from './materials';

/**
 * Builds a chibi character from an avatar config as a plain Three.js group.
 * Used both by the live <Avatar3D> canvas and the thumbnail renderer.
 *
 * Coordinates: feet at y = 0, facing +z. The head is ~45% of total height —
 * big head, small body, big sparkly eyes.
 *
 * Returns { root, parts, dispose } where parts holds the pieces the animator
 * moves: body, head, armL, armR, eyesOpen, eyesClosed, mouths, loveBlush.
 */

const HEAD_R = 0.5;
const HEAD_SCALE = { round: [1, 0.96, 0.95], oval: [0.93, 1.04, 0.94], heart: [1.02, 0.97, 0.93], square: [1.05, 0.94, 0.95] };
const WIDTH = { slim: 0.9, average: 1, soft: 1.13 };

const SLEEVES = {
  tee: 'short', blouse: 'puff', tank: 'none', shirt: 'long', hoodie: 'long', sweater: 'long', pajama: 'long',
  jacket: 'long', blazer: 'long', cardigan: 'long', puffer: 'puffy', kimono: 'wide',
  sundress: 'none', evening: 'none', knit: 'long', floral: 'puff',
};

const BASIC_TOP = { style: 'tee', color: '#D8D2C8' };
const BASIC_BOTTOM = { style: 'shorts', color: '#8C8A94' };

function resolveOutfit(outfit = {}) {
  const get = (slot) => (outfit[slot] ? CLOTHING_BY_ID[outfit[slot]] ?? null : null);
  const dress = get('dress');
  return {
    dress,
    top: dress ? null : get('top') ?? BASIC_TOP,
    bottom: dress ? null : get('bottom') ?? BASIC_BOTTOM,
    outer: get('outer'),
    shoes: get('shoes'),
    glasses: get('glasses'),
    hat: get('hat'),
    earrings: get('earrings'),
    necklace: get('necklace'),
    watch: get('watch'),
    bag: get('bag'),
  };
}

export function buildChibi(config) {
  const geos = [];
  const G = (g) => {
    geos.push(g);
    return g;
  };
  const sphere = (r, w = 28, h = 20, ...rest) => G(new THREE.SphereGeometry(r, w, h, ...rest));
  const capsule = (r, len) => G(new THREE.CapsuleGeometry(r, len, 8, 20));
  const cyl = (rt, rb, h, seg = 24, open = false, ts = 0, tl = Math.PI * 2) => G(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open, ts, tl));
  const torus = (r, t, arc = Math.PI * 2, seg = 24) => G(new THREE.TorusGeometry(r, t, 10, seg, arc));
  const circle = (r, seg = 24, ts = 0, tl = Math.PI * 2) => G(new THREE.CircleGeometry(r, seg, ts, tl));

  const mesh = (geo, mat, pos = [0, 0, 0], scale, rot) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    if (scale) m.scale.set(...(Array.isArray(scale) ? scale : [scale, scale, scale]));
    if (rot) m.rotation.set(...rot);
    return m;
  };
  /** Inverted-hull outline for the big shapes — the "drawn" look. */
  const outline = (m, t = 0.035) => {
    const o = new THREE.Mesh(m.geometry, OUTLINE);
    o.scale.setScalar(1 + t);
    m.add(o);
    return m;
  };

  const skin = config.skin ?? '#E6B999';
  const skinM = toon(skin);
  const skinDark = toon(shade(skin, -0.12));
  const hairColor = config.hair?.color ?? '#3A2621';
  const hairM = toon(hairColor);
  const o = resolveOutfit(config.outfit);
  const w = WIDTH[config.bodyType] ?? 1;
  const hScale = HEIGHTS.find((h) => h.id === config.height)?.scale ?? 1;

  const root = new THREE.Group();
  const body = new THREE.Group(); // everything that bobs/sways
  root.add(body);

  // ---- lower body -------------------------------------------------------
  const legs = new THREE.Group();
  legs.scale.y = hScale;
  body.add(legs);
  const legX = 0.11 * w;
  const bottomLen = { pants: 1, jeans: 1, pajama: 1, sweats: 1 };
  for (const side of [-1, 1]) {
    legs.add(outline(mesh(capsule(0.095, 0.26), skinM, [side * legX, 0.25, 0]), 0.05));
  }
  if (o.bottom) {
    const bm = toon(o.bottom.color);
    if (o.bottom.style === 'skirt') {
      legs.add(outline(mesh(cyl(0.2 * w, 0.33 * w, 0.26, 28), bm, [0, 0.36, 0]), 0.03));
    } else if (o.bottom.style === 'shorts') {
      for (const side of [-1, 1]) legs.add(mesh(cyl(0.112, 0.118, 0.15, 20), bm, [side * legX, 0.37, 0]));
      legs.add(outline(mesh(cyl(0.21 * w, 0.23 * w, 0.1, 24), bm, [0, 0.44, 0]), 0.03));
    } else if (bottomLen[o.bottom.style]) {
      for (const side of [-1, 1]) {
        legs.add(outline(mesh(capsule(0.106, 0.24), bm, [side * legX, 0.27, 0]), 0.045));
        if (o.bottom.accent || o.bottom.style === 'sweats') legs.add(mesh(cyl(0.11, 0.11, 0.035, 20), toon(o.bottom.accent ?? shade(o.bottom.color, -0.18)), [side * legX, 0.1, 0]));
      }
      legs.add(outline(mesh(cyl(0.21 * w, 0.23 * w, 0.12, 24), bm, [0, 0.44, 0]), 0.03));
    }
  }
  if (o.dress) {
    const dm = toon(o.dress.color);
    const long = o.dress.style === 'evening';
    const h = long ? 0.5 : 0.32;
    legs.add(outline(mesh(cyl(0.2 * w, (long ? 0.34 : 0.36) * w, h, 28), dm, [0, 0.5 - h / 2, 0]), 0.03));
    if (o.dress.accent) {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        legs.add(mesh(sphere(0.022, 8, 6), toon(o.dress.accent), [Math.sin(a) * 0.3 * w, 0.28 + (i % 3) * 0.06, Math.cos(a) * 0.3 * w]));
      }
    }
  }

  // shoes
  const shoeM = toon(o.shoes?.color ?? shade(skin, -0.25));
  for (const side of [-1, 1]) {
    const x = side * legX;
    const style = o.shoes?.style;
    const s = style === 'heels' ? [0.8, 0.55, 1.3] : style === 'sandals' ? [0.95, 0.4, 1.45] : [1, 0.62, 1.45];
    const shoe = outline(mesh(sphere(0.1), shoeM, [x, 0.045, 0.035], s), 0.06);
    legs.add(shoe);
    if (style === 'boots') legs.add(outline(mesh(cyl(0.105, 0.11, 0.16, 20), shoeM, [x, 0.12, 0]), 0.04));
    if (style === 'sneakers') legs.add(mesh(cyl(0.1, 0.1, 0.02, 20), toon('#ffffff'), [x, 0.012, 0.035], [1, 1, 1.45]));
    if (style === 'slippers') {
      for (const ear of [-1, 1]) legs.add(mesh(capsule(0.022, 0.07), shoeM, [x + ear * 0.035, 0.12, 0.08], null, [0.3, 0, ear * 0.2]));
    }
  }

  // ---- torso ------------------------------------------------------------
  const torsoY = 0.5 * hScale;
  const torso = new THREE.Group();
  torso.position.y = torsoY;
  body.add(torso);
  const topItem = o.dress ?? o.top;
  const topM = toon(topItem.color);
  const tankLike = topItem.style === 'tank' || topItem.style === 'sundress' || topItem.style === 'evening';
  // chest
  torso.add(outline(mesh(capsule(0.22, 0.16), topM, [0, 0.2, 0], [w * 1.08, 1, 0.82]), 0.035));
  if (tankLike) {
    // bare shoulders
    for (const side of [-1, 1]) torso.add(mesh(sphere(0.085), skinM, [side * 0.2 * w, 0.36, 0], [1, 0.8, 0.9]));
    torso.add(mesh(sphere(0.12, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), skinM, [0, 0.33, 0.06], [1.2 * w, 0.5, 0.8]));
  }
  const dark = toon(shade(topItem.color, -0.2));
  switch (topItem.style) {
    case 'hoodie':
      torso.add(outline(mesh(torus(0.15, 0.055), topM, [0, 0.39, -0.05], null, [Math.PI / 2 - 0.3, 0, 0]), 0.04));
      for (const side of [-1, 1]) torso.add(mesh(capsule(0.009, 0.1), toon('#f5ebdd'), [side * 0.05, 0.27, 0.17]));
      torso.add(mesh(G(new THREE.BoxGeometry(0.2, 0.08, 0.02)), dark, [0, 0.1, 0.175]));
      break;
    case 'shirt':
      for (const side of [-1, 1]) torso.add(mesh(G(new THREE.ConeGeometry(0.05, 0.1, 3)), toon(shade(topItem.color, -0.06)), [side * 0.05, 0.37, 0.15], null, [Math.PI, 0, side * 0.5]));
      for (const y of [0.3, 0.2, 0.1]) torso.add(mesh(sphere(0.011, 8, 6), dark, [0, y, 0.183]));
      break;
    case 'sweater':
    case 'knit':
      torso.add(mesh(torus(0.085, 0.025), dark, [0, 0.4, 0.02], null, [Math.PI / 2, 0, 0]));
      break;
    case 'pajama':
      for (const y of [0.3, 0.2, 0.1]) torso.add(mesh(sphere(0.013, 8, 6), toon(topItem.accent ?? '#fff'), [0, y, 0.183]));
      break;
    case 'blouse':
    case 'floral':
      torso.add(mesh(G(new THREE.ConeGeometry(0.07, 0.12, 3)), skinM, [0, 0.36, 0.14], null, [Math.PI, 0, 0]));
      break;
    default:
      break;
  }
  // hem where top meets bottoms
  if (!o.dress) torso.add(mesh(cyl(0.2 * w, 0.21 * w, 0.05, 24), dark, [0, 0.02, 0], [1, 1, 0.84]));

  // outer layer: an open-front shell so the top shows through
  if (o.outer) {
    const om = toon(o.outer.color);
    const long = o.outer.style === 'kimono';
    if (o.outer.style === 'puffer') {
      torso.add(outline(mesh(capsule(0.25, 0.16), om, [0, 0.2, 0], [w * 1.08, 1, 0.86]), 0.035));
      for (const y of [0.08, 0.2, 0.32]) torso.add(mesh(torus(0.25 * w, 0.012), toon(shade(o.outer.color, -0.18)), [0, y, 0], [1, 1, 0.86], [Math.PI / 2, 0, 0]));
      torso.add(mesh(torus(0.12, 0.05), om, [0, 0.4, 0], null, [Math.PI / 2, 0, 0]));
    } else {
      const h = long ? 0.62 : 0.44;
      const shell = mesh(cyl(0.235 * w, (long ? 0.3 : 0.245) * w, h, 28, true, 0.42, Math.PI * 2 - 0.84), om, [0, 0.42 - h / 2, 0], [1, 1, 0.85]);
      torso.add(outline(shell, 0.03));
      torso.add(mesh(shell.geometry, toon(shade(o.outer.color, -0.3), THREE.BackSide), shell.position.toArray(), [0.99, 1, 0.84]));
      for (const side of [-1, 1]) {
        // lapels / shoulders
        torso.add(outline(mesh(sphere(0.1), om, [side * 0.19 * w, 0.37, 0], [1.1, 0.7, 0.9]), 0.04));
        if (o.outer.style !== 'cardigan') torso.add(mesh(G(new THREE.ConeGeometry(0.045, 0.16, 3)), toon(shade(o.outer.color, -0.15)), [side * 0.085, 0.31, 0.19], null, [Math.PI, 0, side * 0.35]));
      }
      if (o.outer.accent) torso.add(mesh(torus(0.26 * w, 0.014, Math.PI * 2, 32), toon(o.outer.accent), [0, 0.42 - h, 0], [1, 1, 0.85], [Math.PI / 2, 0, 0]));
    }
  }

  // necklace
  if (o.necklace) {
    const nm = o.necklace.style === 'pearls' ? toon(o.necklace.color) : shiny(o.necklace.color);
    torso.add(mesh(torus(0.1, o.necklace.style === 'pearls' ? 0.016 : 0.006, Math.PI * 2, 32), nm, [0, 0.4, 0.04], [1, 1, 1], [Math.PI / 2 - 0.5, 0, 0]));
    if (o.necklace.style === 'pendant') torso.add(mesh(sphere(0.022, 12, 10), nm, [0, 0.33, 0.14]));
  }
  // bag
  if (o.bag) {
    const bm = toon(o.bag.color);
    if (o.bag.style === 'tote') {
      torso.add(outline(mesh(G(new THREE.BoxGeometry(0.2, 0.2, 0.06)), bm, [0.34 * w, -0.02, 0.02]), 0.05));
      torso.add(mesh(torus(0.07, 0.01, Math.PI), bm, [0.34 * w, 0.08, 0.02]));
    } else {
      torso.add(outline(mesh(G(new THREE.BoxGeometry(0.15, 0.12, 0.06)), bm, [-0.24 * w, 0.0, 0.15], null, [0, 0.3, 0]), 0.05));
      const strap = mesh(capsule(0.012, 0.48), toon(shade(o.bag.color, -0.25)), [-0.03, 0.2, 0.17], null, [0, 0, -0.75]);
      torso.add(strap);
    }
  }

  // ---- arms (pivot at the shoulder) ------------------------------------
  const sleeveLayer = o.outer ?? o.dress ?? o.top;
  const sleeve = SLEEVES[sleeveLayer.style] ?? 'short';
  const sleeveM = toon(sleeveLayer.color);
  const makeArm = (side) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.27 * w, torsoY + 0.36, 0);
    arm.add(outline(mesh(capsule(0.068, 0.2), skinM, [0, -0.16, 0]), 0.06));
    arm.add(outline(mesh(sphere(0.075), skinM, [0, -0.33, 0.005]), 0.06));
    if (sleeve === 'short') arm.add(outline(mesh(cyl(0.085, 0.08, 0.12), sleeveM, [0, -0.05, 0]), 0.05));
    if (sleeve === 'puff') arm.add(outline(mesh(sphere(0.095), sleeveM, [0, -0.04, 0], [1, 0.9, 1]), 0.05));
    if (sleeve === 'long' || sleeve === 'puffy') {
      arm.add(outline(mesh(capsule(sleeve === 'puffy' ? 0.092 : 0.078, 0.2), sleeveM, [0, -0.14, 0]), 0.05));
      arm.add(mesh(cyl(0.08, 0.08, 0.03, 16), toon(shade(sleeveLayer.color, -0.18)), [0, -0.26, 0]));
    }
    if (sleeve === 'wide') {
      arm.add(outline(mesh(cyl(0.08, 0.14, 0.26, 20), sleeveM, [0, -0.14, 0]), 0.04));
      if (sleeveLayer.accent) arm.add(mesh(torus(0.14, 0.012), toon(sleeveLayer.accent), [0, -0.27, 0], null, [Math.PI / 2, 0, 0]));
    }
    if (side < 0 && o.watch) {
      arm.add(mesh(cyl(0.074, 0.074, 0.035, 16), toon(o.watch.color), [0, -0.265, 0]));
      arm.add(mesh(cyl(0.025, 0.025, 0.01, 16), toon('#F5EBDD'), [0, -0.265, 0.075], null, [Math.PI / 2, 0, 0]));
    }
    return arm;
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);
  body.add(armL, armR);

  // ---- head -------------------------------------------------------------
  const head = new THREE.Group(); // rotates for head tilts
  head.position.set(0, torsoY + 0.42, 0);
  body.add(head);
  // neck
  head.add(mesh(cyl(0.06, 0.07, 0.1, 16), skinDark, [0, 0.0, 0]));
  const face = new THREE.Group(); // head sphere + everything on it
  const cy = 0.47; // head centre above the neck base
  face.position.y = cy;
  const [sx, sy, sz] = HEAD_SCALE[config.faceShape] ?? HEAD_SCALE.round;
  face.scale.set(sx, sy, sz);
  head.add(face);
  face.add(outline(mesh(sphere(HEAD_R, 40, 30), skinM), 0.025));
  if (config.faceShape === 'heart') face.add(mesh(sphere(0.3, 24, 16), skinM, [0, -0.28, 0.12], [1, 0.8, 1]));

  // ears
  for (const side of [-1, 1]) face.add(outline(mesh(sphere(0.08, 16, 12), skinM, [side * 0.49, -0.03, 0], [0.55, 1, 0.75]), 0.08));

  // A point on the (unit) face sphere, nudged outwards so features sit on it.
  const onFace = (x, y, lift = 0.012) => {
    const z = Math.sqrt(Math.max(0, HEAD_R * HEAD_R - x * x - y * y)) + lift;
    return [x, y, z];
  };
  const faceRot = (x, y) => [-Math.asin(y / HEAD_R) * 0.9, Math.asin(x / HEAD_R) * 0.9, 0];

  // eyes
  const f = config.face ?? {};
  const eyeColor = f.eyeColor ?? '#5A3825';
  const EX = 0.18;
  const EY = -0.06;
  const eyesOpen = new THREE.Group();
  const eyesClosed = new THREE.Group();
  face.add(eyesOpen, eyesClosed);
  for (const side of [-1, 1]) {
    const x = side * EX;
    const eye = new THREE.Group();
    eye.position.set(...onFace(x, EY, 0.0));
    eye.rotation.set(...faceRot(x, EY));
    const big = f.eyes === 'sparkle' ? 1.22 : 1.1;
    eye.add(mesh(sphere(0.085 * big, 24, 18), flat('#241a1c'), [0, 0, 0], [0.78, 1.05, 0.3]));
    eye.add(mesh(sphere(0.064 * big, 24, 18), flat(shade(eyeColor, 0.1)), [0, -0.018, 0.012], [0.72, 0.85, 0.3]));
    eye.add(mesh(sphere(0.035 * big, 16, 12), flat('#120c0e'), [0, -0.012, 0.02], [0.8, 1, 0.3]));
    eye.add(mesh(sphere(0.026, 12, 10), flat('#ffffff'), [side * -0.018 + 0.02, 0.035, 0.03]));
    eye.add(mesh(sphere(0.012, 10, 8), flat('#ffffff'), [-0.022, -0.035, 0.03]));
    if (f.eyes === 'lashes' || f.eyes === 'sparkle') {
      eye.add(mesh(capsule(0.009, 0.045), flat('#241a1c'), [side * 0.07, 0.07, 0.015], null, [0, 0, side * -0.9]));
    }
    if (f.eyes === 'sleepy') {
      // heavy lid
      eye.add(mesh(sphere(0.088, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.1), skinM, [0, 0.004, 0.004], [0.8, 1, 0.34]));
    }
    eyesOpen.add(eye);

    const closed = mesh(torus(0.055, 0.013, Math.PI, 16), flat('#241a1c'), onFace(x, EY - 0.02, 0.004), null, faceRot(x, EY));
    eyesClosed.add(closed);
  }
  if (f.eyes === 'happy') {
    eyesOpen.visible = false;
  } else {
    eyesClosed.visible = false;
  }

  // brows
  const browM = flat(shade(hairColor, -0.1));
  const browTilt = { arched: 0.25, straight: 0, thick: 0.1, soft: 0.12 }[f.brows] ?? 0.12;
  const browR = f.brows === 'thick' ? 0.017 : 0.011;
  for (const side of [-1, 1]) {
    const x = side * 0.17;
    const b = mesh(capsule(browR, 0.07), browM, onFace(x, 0.1, 0.006), null, [...faceRot(x, 0.1).slice(0, 2), Math.PI / 2 + side * browTilt]);
    face.add(b);
  }

  // nose
  face.add(mesh(sphere(0.018, 10, 8), toon(shade(skin, -0.1)), onFace(0, -0.12, 0.0)));

  // mouths (one visible at a time; expressions switch between them)
  const lip = '#8C3F48';
  const mouths = {};
  const MY = -0.2;
  const mouthAt = (g) => {
    g.position.set(...onFace(0, MY, 0.004));
    g.rotation.set(...faceRot(0, MY));
    g.visible = false;
    face.add(g);
    return g;
  };
  {
    const g = new THREE.Group();
    g.add(mesh(torus(0.045, 0.011, Math.PI, 16), flat(lip), [0, 0.02, 0], null, [0, 0, Math.PI]));
    mouths.smile = mouthAt(g);
  }
  {
    const g = new THREE.Group();
    g.add(mesh(circle(0.058, 20, Math.PI, Math.PI), flat('#6E2F35'), [0, 0.012, 0]));
    g.add(mesh(circle(0.038, 16, Math.PI * 1.15, Math.PI * 0.7), flat('#ffffff'), [0, 0.008, 0.001]));
    g.add(mesh(circle(0.03, 16), flat('#E07A85'), [0, -0.03, 0.001], [1, 0.45, 1]));
    mouths.grin = mouthAt(g);
  }
  {
    const g = new THREE.Group();
    for (const side of [-1, 1]) g.add(mesh(torus(0.022, 0.009, Math.PI, 12), flat(lip), [side * 0.022, 0.01, 0], null, [0, 0, Math.PI]));
    mouths.cat = mouthAt(g);
  }
  {
    const g = new THREE.Group();
    g.add(mesh(torus(0.045, 0.011, Math.PI * 0.8, 16), flat(lip), [0.01, 0.02, 0], null, [0, 0, Math.PI * 1.15]));
    mouths.smirk = mouthAt(g);
  }
  {
    const g = new THREE.Group();
    g.add(mesh(circle(0.028, 16), flat('#6E2F35'), [0, 0, 0], [0.85, 1.1, 1]));
    mouths.o = mouthAt(g);
  }
  {
    const g = new THREE.Group();
    g.add(mesh(torus(0.022, 0.012, Math.PI * 2, 16), flat('#C4505E')));
    mouths.kiss = mouthAt(g);
  }
  (mouths[f.mouth] ?? mouths.smile).visible = true;

  // cheeks
  const blushM = flat('#F08A95', 0.4);
  const blush = new THREE.Group();
  const loveBlush = new THREE.Group();
  for (const side of [-1, 1]) {
    const x = side * 0.3;
    const pos = onFace(x, -0.13, 0.006);
    const rot = faceRot(x, -0.13);
    blush.add(mesh(circle(0.07, 20), blushM, pos, [1, 0.6, 1], rot));
    loveBlush.add(mesh(circle(0.085, 20), flat('#F07080', 0.5), pos, [1, 0.62, 1], rot));
    if (f.extra === 'freckles' || f.extra === 'blush-freckles') {
      for (const [dx, dy] of [[-0.03, 0.02], [0.02, 0.03], [0.0, -0.01], [0.035, -0.015]]) face.add(mesh(sphere(0.007, 6, 5), flat(shade(skin, -0.35)), onFace(x + dx, -0.1 + dy, 0.004)));
    }
  }
  if (f.extra !== 'none' && f.extra !== 'freckles') face.add(blush);
  loveBlush.visible = false;
  face.add(loveBlush);
  if (f.extra === 'mole') face.add(mesh(sphere(0.009, 8, 6), flat(shade(skin, -0.5)), onFace(0.1, -0.24, 0.004)));

  // ---- hair ---------------------------------------------------------------
  const hair = new THREE.Group();
  face.add(hair);
  const style = config.hair?.style ?? 'bob';
  const light = toon(shade(hairColor, 0.22));
  // base cap: covers the crown and back, tilted so the forehead shows
  const capR = style === 'buzz' ? 0.508 : 0.535;
  const cap = outline(mesh(sphere(capR, 36, 24, 0, Math.PI * 2, 0, Math.PI * (style === 'buzz' ? 0.42 : 0.55)), hairM), 0.02);
  cap.rotation.x = -0.42;
  hair.add(cap);
  // back of the head (so it's never bald from the side)
  hair.add(mesh(sphere(capR - 0.004, 32, 20, Math.PI / 2 + 1.25, Math.PI * 2 - 2.5, Math.PI * 0.3, Math.PI * 0.42), hairM));

  // Fringe: soft teardrop locks that start under the cap and fall over the forehead.
  const bangs = (n, spread, y = 0.3, size = 0.14, droop = 0.05) => {
    const lock = G(new THREE.ConeGeometry(1, 1, 16, 1, false));
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1) - 0.5;
      const x = t * spread;
      const yy = y - 0.12 - Math.abs(t) * droop;
      const g = new THREE.Group();
      g.position.set(...onFace(x, yy, 0.028));
      g.rotation.set(...faceRot(x, yy).slice(0, 2), 0);
      const drop = mesh(lock, hairM, [0, 0, 0], [size * 0.95, size * 1.9, size * 0.45], [Math.PI, 0, t * 0.9]);
      g.add(outline(drop, 0.06));
      g.add(mesh(sphere(1, 16, 12), hairM, [0, size * 0.75, -0.01], [size * 0.95, size * 0.6, size * 0.5]));
      hair.add(g);
    }
  };
  const sideStrands = (len, wavy = false) => {
    for (const side of [-1, 1]) {
      if (wavy) {
        // a soft S-curve of overlapping locks
        const strand = new THREE.Group();
        strand.add(outline(mesh(capsule(0.1, 0.5), hairM, [side * 0.44, -0.4, 0.04], [1, 1, 0.8]), 0.03));
        for (let i = 0; i < 3; i++) strand.add(mesh(sphere(0.11, 20, 14), hairM, [side * (0.44 + (i % 2 ? 0.05 : -0.02)), -0.25 - i * 0.2, 0.05], [1, 1.2, 0.85]));
        hair.add(strand);
      } else {
        hair.add(outline(mesh(capsule(0.09, len), hairM, [side * 0.43, -0.12 - len / 2, 0.05], [1, 1, 0.8]), 0.05));
      }
    }
  };
  const backPanel = (len, width = 0.34) => {
    hair.add(outline(mesh(capsule(width, len), hairM, [0, -0.1 - len / 2, -0.2], [1.15, 1, 0.55]), 0.03));
  };

  switch (style) {
    case 'short':
      bangs(5, 0.55, 0.3, 0.14, 0.06);
      break;
    case 'sidepart':
      bangs(3, 0.3, 0.3, 0.12);
      hair.add(outline(mesh(sphere(0.2, 24, 16), hairM, onFace(-0.14, 0.3, -0.07), [1.5, 0.55, 0.7], [-0.4, -0.25, 0.35]), 0.04));
      break;
    case 'messy':
      bangs(5, 0.55, 0.3, 0.12, 0.08);
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        const cone = mesh(G(new THREE.ConeGeometry(0.07, 0.2, 10)), hairM, [Math.cos(a) * 0.3, 0.42, Math.sin(a) * 0.3 - 0.05], null, [Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6]);
        hair.add(outline(cone, 0.06));
      }
      break;
    case 'buzz':
      break;
    case 'curly':
      for (let i = 0; i < 46; i++) {
        const phi = Math.acos(1 - (i / 46) * 1.25);
        const th = i * 2.399;
        const p = new THREE.Vector3(Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th)).multiplyScalar(0.52);
        if (p.z > 0.25 && p.y < 0.28) continue; // keep the face clear
        hair.add(outline(mesh(sphere(0.115, 14, 10), i % 5 ? hairM : light, p.toArray()), 0.05));
      }
      for (const side of [-1, 1]) hair.add(mesh(sphere(0.13, 14, 10), hairM, [side * 0.45, -0.05, -0.05]));
      break;
    case 'bob':
      bangs(5, 0.6, 0.27, 0.13, 0.02);
      hair.add(outline(mesh(sphere(0.56, 32, 20, Math.PI / 2 + 1.05, Math.PI * 2 - 2.1, Math.PI * 0.25, Math.PI * 0.5), hairM, [0, -0.02, -0.02]), 0.02));
      break;
    case 'long':
      bangs(4, 0.5, 0.28, 0.13);
      sideStrands(0.34);
      backPanel(0.55);
      break;
    case 'wavy':
      bangs(2, 0.4, 0.3, 0.16, 0.02);
      sideStrands(0, true);
      backPanel(0.6, 0.36);
      break;
    case 'ponytail': {
      bangs(4, 0.5, 0.28, 0.13);
      const tail = new THREE.Group();
      tail.position.set(0, 0.25, -0.45);
      tail.add(mesh(torus(0.06, 0.025), toon('#E8B4A0'), [0, 0, 0], null, [0.4, 0, 0]));
      tail.add(outline(mesh(capsule(0.1, 0.42), hairM, [0, -0.25, -0.1], null, [0.35, 0, 0]), 0.05));
      hair.add(tail);
      break;
    }
    case 'buns':
      bangs(5, 0.58, 0.27, 0.13, 0.02);
      for (const side of [-1, 1]) hair.add(outline(mesh(sphere(0.16, 20, 16), hairM, [side * 0.3, 0.42, -0.08]), 0.04));
      break;
    default:
      bangs(4, 0.5);
  }
  // anime sheen
  if (style !== 'buzz' && style !== 'curly') hair.add(mesh(torus(0.34, 0.018, Math.PI * 0.6, 20), light, [0, 0.36, 0.1], null, [-1.1, 0, Math.PI * 0.2]));

  // ---- accessories on the head --------------------------------------------
  if (o.glasses) {
    const gm = toon(o.glasses.color);
    const g = new THREE.Group();
    for (const side of [-1, 1]) {
      const x = side * EX;
      const pos = onFace(x, EY, 0.05);
      if (o.glasses.style === 'sun' || o.glasses.style === 'heart') {
        const lens = o.glasses.style === 'heart' ? heartGeo(G, 0.1) : circle(0.1, 24);
        g.add(mesh(lens, flat(o.glasses.color, 0.92), pos, null, faceRot(x, EY)));
      }
      const ring = o.glasses.style === 'square' ? G(new THREE.TorusGeometry(0.1, 0.012, 6, 4)) : torus(0.1, 0.012, Math.PI * 2, 28);
      if (o.glasses.style !== 'heart') g.add(mesh(ring, gm, pos, o.glasses.style === 'square' ? [1.1, 0.8, 1] : null, [...faceRot(x, EY).slice(0, 2), o.glasses.style === 'square' ? Math.PI / 4 : 0]));
    }
    g.add(mesh(capsule(0.008, 0.12), gm, onFace(0, EY + 0.03, 0.05), null, [0, 0, Math.PI / 2]));
    face.add(g);
  }
  if (o.hat) {
    const hm = toon(o.hat.color);
    const hd = toon(shade(o.hat.color, -0.2));
    const hat = new THREE.Group();
    switch (o.hat.style) {
      case 'beanie':
        hat.add(outline(mesh(sphere(0.56, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.44), hm, [0, 0.02, -0.02], null, [-0.25, 0, 0]), 0.02));
        hat.add(mesh(torus(0.5, 0.06, Math.PI * 2, 40), hd, [0, 0.17, 0.02], null, [Math.PI / 2 - 0.25, 0, 0]));
        hat.add(outline(mesh(sphere(0.1, 16, 12), toon(shade(o.hat.color, 0.35)), [0, 0.6, -0.12]), 0.05));
        break;
      case 'cap':
        hat.add(outline(mesh(sphere(0.55, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.42), hm, [0, 0.03, -0.02], null, [-0.25, 0, 0]), 0.02));
        hat.add(outline(mesh(cyl(0.32, 0.32, 0.03, 28, false, -Math.PI / 2, Math.PI), hd, [0, 0.25, 0.32], [1, 1, 1.1], [0.2, 0, 0]), 0.04));
        break;
      case 'beret':
        hat.add(outline(mesh(sphere(0.48, 28, 16), hm, [0.05, 0.42, -0.02], [1, 0.32, 1], [0, 0, -0.22]), 0.03));
        break;
      case 'sunhat':
        hat.add(outline(mesh(cyl(0.95, 0.95, 0.025, 48), hm, [0, 0.32, 0], null, [-0.12, 0, 0]), 0.02));
        hat.add(outline(mesh(sphere(0.52, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.45), hm, [0, 0.14, -0.04], null, [-0.12, 0, 0]), 0.02));
        hat.add(mesh(torus(0.49, 0.035, Math.PI * 2, 40), toon(o.hat.accent ?? '#3B3E4C'), [0, 0.37, -0.02], null, [Math.PI / 2 - 0.12, 0, 0]));
        break;
      case 'flowers':
        for (let i = 0; i < 9; i++) {
          const a = -Math.PI * 0.95 + (i / 8) * Math.PI * 0.9 - Math.PI * 0.03;
          const c = [o.hat.color, o.hat.accent ?? '#B8A7D9', '#F5EBDD'][i % 3];
          hat.add(mesh(sphere(0.06, 12, 10), toon(c), [Math.cos(a) * 0.46, 0.33, -Math.sin(a) * 0.46 - 0.02]));
          hat.add(mesh(sphere(0.025, 8, 6), toon('#F2C98B'), [Math.cos(a) * 0.5, 0.35, -Math.sin(a) * 0.5]));
        }
        break;
      default:
        break;
    }
    face.add(hat);
  }
  if (o.earrings) {
    const em = o.earrings.style === 'pearls' ? toon(o.earrings.color) : shiny(o.earrings.color);
    for (const side of [-1, 1]) {
      const pos = [side * 0.5, -0.12, 0.02];
      if (o.earrings.style === 'hoops') face.add(mesh(torus(0.035, 0.007), em, [pos[0], pos[1] - 0.03, pos[2]], null, [0, Math.PI / 2, 0]));
      else if (o.earrings.style === 'pearls') face.add(mesh(sphere(0.026, 12, 10), em, [pos[0], pos[1] - 0.04, pos[2]]));
      else face.add(mesh(sphere(0.018, 10, 8), em, pos));
    }
  }

  // soft contact shadow
  const shadow = mesh(circle(0.34, 32), flat('#000000', 0.22), [0, 0.003, 0], [1.2, 1, 0.8], [-Math.PI / 2, 0, 0]);
  root.add(shadow);

  return {
    root,
    parts: { body, head, armL, armR, eyesOpen, eyesClosed, mouths, loveBlush, defaultMouth: mouths[f.mouth] ? f.mouth : 'smile', happyEyes: f.eyes === 'happy' },
    dispose: () => geos.forEach((g) => g.dispose()),
  };
}

function heartGeo(G, s) {
  const shape = new THREE.Shape();
  shape.moveTo(0, -s * 0.9);
  shape.bezierCurveTo(-s * 1.2, -s * 0.1, -s * 0.9, s * 0.9, 0, s * 0.35);
  shape.bezierCurveTo(s * 0.9, s * 0.9, s * 1.2, -s * 0.1, 0, -s * 0.9);
  return G(new THREE.ShapeGeometry(shape, 16));
}
