import { useMemo } from 'react';
import { seeded } from './effects';

/** Rain drawn in SVG so it can be clipped to windows. */
export function SvgRain({ x, y, w, h, count = 60, seed = 9, color = '#C8D2F0', clipId }) {
  const drops = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: count }, () => ({ x: x + r() * (w + 60), y: y - 40 + r() * h * 0.6, len: 18 + r() * 26, dur: 0.6 + r() * 0.5, d: -r() * 2, o: 0.2 + r() * 0.5 }));
  }, [x, y, w, h, count, seed]);
  return (
    <g className="svg-rain" clipPath={clipId ? `url(#${clipId})` : undefined} stroke={color} strokeWidth="1.3" strokeLinecap="round">
      {drops.map((d, i) => (
        <line key={i} x1={d.x} y1={d.y} x2={d.x - 6} y2={d.y + d.len} opacity={d.o} style={{ animationDuration: `${d.dur}s`, animationDelay: `${d.d}s` }} />
      ))}
    </g>
  );
}

export function Vignette({ id, strength = 0.55 }) {
  return (
    <>
      <defs>
        <radialGradient id={id} cx="50%" cy="45%" r="75%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#05050A" stopOpacity={strength} />
        </radialGradient>
      </defs>
      <rect width="1600" height="1000" fill={`url(#${id})`} />
    </>
  );
}

export function Glow({ id, cx, cy, r, color = '#F2C98B', opacity = 0.5, className = 'animate-flicker' }) {
  return (
    <>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity={opacity} />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} className={className} />
    </>
  );
}
