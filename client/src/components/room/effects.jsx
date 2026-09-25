import { useMemo, useEffect, useState } from 'react';

// Deterministic pseudo-random so ambient layouts don't jump between renders.
export function seeded(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** CSS rain. Place inside a positioned, overflow-hidden parent. */
export function Rain({ count = 70, seed = 7, opacity = 1, className = '' }) {
  const drops = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: count }, () => ({
      left: r() * 110 - 5,
      h: 30 + r() * 60,
      dur: 0.55 + r() * 0.5,
      delay: -r() * 2,
      o: 0.25 + r() * 0.6,
    }));
  }, [count, seed]);
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} style={{ opacity }} aria-hidden>
      {drops.map((d, i) => (
        <span key={i} className="rain-drop" style={{ left: `${d.left}%`, height: d.h, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s`, opacity: d.o }} />
      ))}
    </div>
  );
}

/** Floating dust / fireflies / sparks. */
export function Motes({ count = 18, color = '#F2C98B', seed = 3, size = [2, 4], area = 'bottom', className = '' }) {
  const motes = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: count }, () => ({
      left: r() * 100,
      top: area === 'all' ? r() * 100 : 35 + r() * 60,
      s: size[0] + r() * (size[1] - size[0]),
      dur: 6 + r() * 8,
      delay: -r() * 10,
    }));
  }, [count, seed, area, size]);
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden>
      {motes.map((m, i) => (
        <span
          key={i}
          className="mote"
          style={{ left: `${m.left}%`, top: `${m.top}%`, width: m.s, height: m.s, background: color, boxShadow: `0 0 ${m.s * 3}px ${color}`, animationDuration: `${m.dur}s`, animationDelay: `${m.delay}s` }}
        />
      ))}
    </div>
  );
}

/** SVG star field for use inside a scene's <svg>. */
export function StarField({ count = 90, seed = 11, x = 0, y = 0, w = 1600, h = 500, maxR = 1.8 }) {
  const stars = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: count }, () => ({ cx: x + r() * w, cy: y + r() * h * (0.3 + r() * 0.7), r: 0.4 + r() * maxR, d: r() * 4, dur: 2 + r() * 4 }));
  }, [count, seed, x, y, w, h, maxR]);
  return (
    <g fill="#FFF6E8">
      {stars.map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r={s.r} className="animate-twinkle" style={{ animationDelay: `${s.d}s`, animationDuration: `${s.dur}s` }} />
      ))}
    </g>
  );
}

/** Live clock hands for a wall clock. */
export function useClock(interval = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}

export function WallClock({ cx, cy, r = 38, face = '#F5EBDD', rim = '#6B4A3A' }) {
  const now = useClock(1000);
  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();
  const hand = (deg, len, w, color) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return <line x1={cx} y1={cy} x2={cx + Math.cos(rad) * len} y2={cy + Math.sin(rad) * len} stroke={color} strokeWidth={w} strokeLinecap="round" />;
  };
  return (
    <g aria-label={`Clock showing ${now.toLocaleTimeString()}`}>
      <circle cx={cx} cy={cy} r={r + 5} fill={rim} />
      <circle cx={cx} cy={cy} r={r} fill={face} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return <circle key={i} cx={cx + Math.sin(a) * (r - 7)} cy={cy - Math.cos(a) * (r - 7)} r={i % 3 === 0 ? 2.2 : 1.2} fill="#6B4A3A" />;
      })}
      {hand(h * 30 + m * 0.5, r * 0.5, 4, '#3B3128')}
      {hand(m * 6, r * 0.75, 3, '#3B3128')}
      {hand(s * 6, r * 0.8, 1.2, '#D4937C')}
      <circle cx={cx} cy={cy} r="3" fill="#3B3128" />
    </g>
  );
}

export function Skyline({ y = 560, color = '#15162A', windowColor = '#F2C98B', seed = 5, x0 = 0, width = 1600, maxH = 260 }) {
  const buildings = useMemo(() => {
    const r = seeded(seed);
    const out = [];
    let x = x0;
    while (x < x0 + width) {
      const w = 50 + r() * 90;
      const h = 80 + r() * maxH;
      const lights = [];
      for (let yy = y - h + 14; yy < y - 10; yy += 18) for (let xx = x + 8; xx < x + w - 10; xx += 16) if (r() < 0.22) lights.push([xx, yy, r()]);
      out.push({ x, w, h, lights });
      x += w + 4 + r() * 10;
    }
    return out;
  }, [y, seed, x0, width, maxH]);
  return (
    <g>
      {buildings.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={y - b.h} width={b.w} height={b.h + 400} fill={color} />
          {b.lights.map(([lx, ly, d], j) => (
            <rect key={j} x={lx} y={ly} width="7" height="9" rx="1" fill={windowColor} opacity={0.35 + d * 0.5} className={d > 0.85 ? 'animate-twinkle' : undefined} style={d > 0.85 ? { animationDuration: `${4 + d * 6}s` } : undefined} />
          ))}
        </g>
      ))}
    </g>
  );
}
