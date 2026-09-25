import { memo, useId } from 'react';
import { motion } from 'framer-motion';
import { CLOTHING_BY_ID, HEIGHTS } from '../../catalog/avatarItems';
import { shade } from '../../lib/color';
import { bodyDims, headPath, torsoPath, hipPath, legPath, shoulder } from './geometry';
import { HairBack, HairFront } from './parts/Hair';
import Face from './parts/Face';
import { Bottom, Top, Outer, Dress, Shoes, sleeveFor } from './parts/Clothing';
import { Glasses, Hat, Earrings, Necklace, Bag } from './parts/Accessories';

/**
 * Arm angles in degrees. 0 = hanging straight down. Positive rotates the hand
 * towards canvas-left, negative towards canvas-right. Avatars always "face"
 * canvas-right (towards their partner); `flip` mirrors the whole drawing.
 */
const POSES = {
  idle: { l: 9, r: -9 },
  wave: { l: 9, r: [-150, -120, -150, -120, -150, -135] },
  hug: { l: -38, r: -82 },
  highfive: { l: 9, r: -168 },
  pat: { l: 9, r: [-118, -128, -118, -128, -118] },
  dance: { l: -32, r: -96 },
  kiss: { l: 12, r: -22 },
  heart: { l: 152, r: -152 },
  cheer: { l: [150, 140, 150], r: [-150, -140, -150] },
};

const BODY_MOTION = {
  idle: { animate: { y: [0, -1.4, 0] }, transition: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' } },
  dance: { animate: { rotate: [-3, 3, -3], y: [0, -1.5, 0] }, transition: { duration: 3.6, repeat: Infinity, ease: 'easeInOut' } },
  kiss: { animate: { rotate: 5 }, transition: { type: 'spring', stiffness: 120, damping: 14 } },
  hug: { animate: { rotate: 4 }, transition: { type: 'spring', stiffness: 120, damping: 14 } },
  cheer: { animate: { y: [0, -9, 0, -9, 0] }, transition: { duration: 1.2 } },
};

function Arm({ side, angle, skin, sleeve, watch, dims, animated }) {
  const { x, y } = shoulder(dims, side);
  const keyframes = Array.isArray(angle);
  const sc = sleeve.color;
  const scDark = sc ? shade(sc, -0.18) : undefined;
  return (
    <g transform={`translate(${x},${y})`}>
      <motion.g
        initial={false}
        animate={{ rotate: angle }}
        transition={
          keyframes
            ? { duration: 1.6, ease: 'easeInOut' }
            : animated
              ? { type: 'spring', stiffness: 90, damping: 13 }
              : { duration: 0 }
        }
        style={{ originX: 0.5, originY: 0 }}
      >
        <rect x="-6" y="-3" width="12" height="54" rx="6" fill={skin} />
        <circle cx="0" cy="55" r="7" fill={skin} />
        {sleeve.length === 'short' && <rect x="-7.5" y="-5" width="15" height="19" rx="6" fill={sc} />}
        {sleeve.length === 'puff' && <ellipse cx="0" cy="5" rx="9.5" ry="11" fill={sc} />}
        {(sleeve.length === 'long' || sleeve.length === 'puffy') && (
          <g>
            <rect x={sleeve.length === 'puffy' ? -9 : -7.5} y="-5" width={sleeve.length === 'puffy' ? 18 : 15} height="52" rx="7" fill={sc} />
            <rect x="-7" y="43" width="14" height="4" rx="2" fill={scDark} />
            {sleeve.length === 'puffy' && <path d="M-9,12 L9,12 M-9,26 L9,26" stroke={scDark} strokeWidth="1.2" />}
          </g>
        )}
        {sleeve.length === 'wide' && (
          <g>
            <path d="M-8,-5 L8,-5 L13,40 Q0,46 -13,40 Z" fill={sc} />
            <path d="M-13,40 Q0,46 13,40" stroke={sleeve.accent} strokeWidth="2.5" fill="none" />
          </g>
        )}
        {watch && (
          <g>
            <rect x="-6.5" y="45" width="13" height="4.5" rx="1.5" fill={watch.color} />
            <circle cx="0" cy="47.3" r="3" fill="#F5EBDD" stroke={shade(watch.color, -0.2)} strokeWidth="1" />
          </g>
        )}
      </motion.g>
    </g>
  );
}

function resolveOutfit(outfit = {}) {
  const get = (slot) => (outfit[slot] ? CLOTHING_BY_ID[outfit[slot]] : null);
  const dress = get('dress');
  return {
    dress,
    top: dress ? null : get('top'),
    bottom: dress ? null : get('bottom'),
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

// Fallbacks so an avatar is never drawn without basics.
const BASIC_TOP = { style: 'tee', color: '#D8D2C8' };
const BASIC_BOTTOM = { style: 'shorts', color: '#8C8A94' };

function Avatar({
  config,
  size = 240,
  pose = 'idle',
  expression = null,
  flip = false,
  crop = 'full',
  animated = true,
  className = '',
  label,
}) {
  const uid = useId().replace(/:/g, '');
  if (!config) return null;
  const dims = bodyDims(config.bodyType);
  const o = resolveOutfit(config.outfit);
  const top = o.top ?? (o.dress ? null : BASIC_TOP);
  const bottom = o.bottom ?? (o.dress ? null : BASIC_BOTTOM);
  const skin = config.skin;
  const skinShade = shade(skin, -0.12);
  const heightScale = HEIGHTS.find((h) => h.id === config.height)?.scale ?? 1;
  const sleeve = sleeveFor({ top, outer: o.outer, dress: o.dress });
  const p = POSES[pose] ?? POSES.idle;
  const bodyMotion = animated ? BODY_MOTION[pose] ?? BODY_MOTION.idle : null;
  const footY = 130 + (272 - 130) * heightScale;

  const CROPS = { head: '36 16 128 128', torso: '30 96 140 140', legs: '35 165 130 130', feet: '50 215 100 70', full: '0 0 200 300' };
  const viewBox = CROPS[crop] ?? CROPS.full;
  const [, , vw, vh] = viewBox.split(' ').map(Number);
  const width = (size * vw) / vh;

  const body = (
    <g transform={`translate(100 130) scale(1 ${heightScale}) translate(-100 -130)`}>
      {/* legs + shoes */}
      <path d={legPath(dims, -1)} fill={skin} />
      <path d={legPath(dims, 1)} fill={skin} />
      <path d={hipPath(dims)} fill={skin} />
      <Shoes item={o.shoes} dims={dims} />
      <Bottom item={bottom} dims={dims} />
      {/* torso */}
      <rect x="91" y="120" width="18" height="24" rx="6" fill={skinShade} />
      <path d={torsoPath(dims)} fill={skin} />
      {o.dress ? <Dress item={o.dress} dims={dims} skin={skin} /> : <Top item={top} dims={dims} skin={skin} />}
      <Necklace item={o.necklace} />
      <Outer item={o.outer} dims={dims} />
      <Bag item={o.bag} dims={dims} />
      <Arm side={-1} angle={p.l} skin={skin} sleeve={sleeve} watch={o.watch} dims={dims} animated={animated} />
      <Arm side={1} angle={p.r} skin={skin} sleeve={sleeve} dims={dims} animated={animated} />
    </g>
  );

  const headTilt = pose === 'kiss' || pose === 'dance' || pose === 'hug' ? 6 : pose === 'pat' ? -3 : 0;
  // Head rotates around the neck. Hair-back is its own layer (drawn behind the
  // body) but must tilt with the head, so both share this transform.
  const headProps = {
    style: {
      transform: `rotate(${animated ? headTilt : 0}deg)`,
      transformOrigin: '100px 128px',
      transition: 'transform 700ms cubic-bezier(.34,1.3,.64,1)',
    },
  };
  const hairBack = (
    <g {...headProps}>
      <HairBack style={config.hair.style} color={config.hair.color} />
    </g>
  );
  const head = (
    <g {...headProps}>
      <ellipse cx="56" cy="93" rx="6" ry="9" fill={skin} />
      <ellipse cx="144" cy="93" rx="6" ry="9" fill={skin} />
      <path d={headPath(config.faceShape)} fill={skin} />
      <path d={headPath(config.faceShape)} fill={`url(#faceGlow-${uid})`} />
      <Earrings item={o.earrings} />
      <Face face={config.face} skin={skin} hairColor={config.hair.color} expression={expression} />
      <Glasses item={o.glasses} />
      <HairFront style={config.hair.style} color={config.hair.color} />
      <Hat item={o.hat} />
    </g>
  );

  return (
    <svg
      viewBox={viewBox}
      width={width}
      height={size}
      className={className}
      role="img"
      aria-label={label ?? 'Avatar'}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="hairShade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".35" />
        </linearGradient>
        <radialGradient id={`faceGlow-${uid}`} cx=".38" cy=".3" r=".8">
          <stop offset="0" stopColor="#fff" stopOpacity=".16" />
          <stop offset=".6" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".08" />
        </radialGradient>
      </defs>
      <g transform={flip ? 'translate(200 0) scale(-1 1)' : undefined}>
        {crop !== 'head' && <ellipse cx="100" cy={footY + 4} rx="40" ry="6" fill="#000" opacity=".28" />}
        <motion.g
          initial={false}
          animate={bodyMotion?.animate ?? { rotate: 0, y: 0 }}
          transition={bodyMotion?.transition}
          style={{ originX: 0.5, originY: 1 }}
        >
          {hairBack}
          {crop !== 'head' && body}
          {head}
        </motion.g>
      </g>
    </svg>
  );
}

export default memo(Avatar);
