import { lazy, memo, Suspense } from 'react';
import { useReducedMotion } from 'framer-motion';
import { BLANK_AVATAR } from '../../data/defaultAvatars';
import { useChibiSnapshot } from './chibi/snapshot';
import { FRAMES, hasWebGL } from './chibi/stage';
import AvatarSvg from './AvatarSvg';

const Avatar3D = lazy(() => import('./Avatar3D'));

function Snapshot({ config, size, pose, expression, flip, crop, className, label, width }) {
  const url = useChibiSnapshot({ config, crop, flip, pose, expression, size });
  return (
    <span className={className} style={{ display: 'inline-block', width, height: size }} role="img" aria-label={label}>
      {url ? (
        <img src={url} alt="" draggable={false} style={{ width, height: size, display: 'block' }} />
      ) : (
        <span className="block h-full w-full animate-pulse rounded-full bg-surface-3/40" style={{ transform: 'scale(0.6)' }} />
      )}
    </span>
  );
}

/**
 * The one avatar component used everywhere.
 *   - big, animated avatars → a live 3D chibi (its own small WebGL canvas)
 *   - thumbnails / crops / animated={false} → a cached 3D render as an image
 *   - no WebGL at all → the older 2D drawing, so nobody is ever invisible
 */
function Avatar({ config: given, size = 240, pose = 'idle', expression = null, flip = false, crop = 'full', animated = true, className = '', label = 'Avatar' }) {
  const config = given ?? BLANK_AVATAR;
  const reduced = useReducedMotion();
  const frame = FRAMES[crop] ?? FRAMES.full;
  const width = Math.round(size * frame.aspect);

  if (!hasWebGL()) return <AvatarSvg config={config} size={size} pose={pose} expression={expression} flip={flip} crop={crop} animated={animated} className={className} label={label} />;

  const live = animated && crop === 'full' && size >= 140;
  if (!live) return <Snapshot config={config} size={size} pose={pose} expression={expression} flip={flip} crop={crop} className={className} label={label} width={width} />;

  return (
    <span className={className} style={{ display: 'inline-block', width, height: size }}>
      <Suspense fallback={<Snapshot config={config} size={size} pose={pose} expression={expression} flip={flip} crop={crop} label={label} width={width} />}>
        <Avatar3D config={config} pose={pose} expression={expression} flip={flip} crop={crop} motion={!reduced} width={width} height={size} label={label} />
      </Suspense>
    </span>
  );
}

export default memo(Avatar);
