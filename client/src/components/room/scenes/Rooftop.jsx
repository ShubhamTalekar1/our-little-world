import { StarField, Skyline } from '../effects';
import { Vignette, Glow } from '../effectsSvg';

function StringLights({ y = 170, sag = 70 }) {
  const bulbs = Array.from({ length: 22 }, (_, i) => {
    const t = i / 21;
    return [100 + t * 1400, y + Math.sin(t * Math.PI) * sag];
  });
  return (
    <g>
      <path d={`M100,${y} Q800,${y + sag * 2} 1500,${y}`} stroke="#2B2B3A" strokeWidth="2" fill="none" />
      {bulbs.map(([x, by], i) => (
        <g key={i}>
          <circle cx={x} cy={by + 8} r="16" fill="#F2C98B" opacity=".15" className="animate-twinkle" style={{ animationDelay: `${i * 0.3}s`, animationDuration: '4s' }} />
          <circle cx={x} cy={by + 8} r="5" fill="#FFE2A8" />
        </g>
      ))}
    </g>
  );
}

export default function Rooftop() {
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="rt-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#070918" />
          <stop offset=".6" stopColor="#1B1B3A" />
          <stop offset="1" stopColor="#3A2A4A" />
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#rt-sky)" />
      <StarField count={140} seed={21} h={520} />
      <g className="shooting-star">
        <line x1="1300" y1="80" x2="1360" y2="50" stroke="#FFF6E8" strokeWidth="2" strokeLinecap="round" opacity=".8" />
      </g>
      <circle cx="1240" cy="170" r="46" fill="#F5EBDD" />
      <circle cx="1258" cy="160" r="46" fill="#1B1B3A" opacity=".9" />
      <Glow id="rt-city" cx="800" cy="720" r="700" color="#E8B4A0" opacity={0.18} className="" />
      <Skyline y={700} seed={31} maxH={300} color="#121326" />
      <Skyline y={740} seed={12} maxH={170} color="#0C0D1C" />
      <StringLights />
      {/* parapet + floor */}
      <rect x="0" y="720" width="1600" height="60" fill="#2E2A36" />
      <rect x="0" y="712" width="1600" height="14" fill="#3E3848" />
      <rect x="0" y="780" width="1600" height="220" fill="#221F29" />
      <g stroke="#000" opacity=".2">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <line key={i} x1={i * 200} y1="780" x2={i * 200 - 120} y2="1000" />
        ))}
      </g>
      {/* planters */}
      {[140, 1440].map((x) => (
        <g key={x}>
          <rect x={x - 60} y="620" width="120" height="110" rx="10" fill="#4A3833" />
          <circle cx={x - 30} cy="600" r="40" fill="#5E7A60" />
          <circle cx={x + 20} cy="585" r="48" fill="#6E8C70" />
          <circle cx={x + 40} cy="620" r="30" fill="#5E7A60" />
        </g>
      ))}
      {/* blanket */}
      <path d="M520,880 L1080,880 L1120,960 L480,960 Z" fill="#B8A7D9" opacity=".55" />
      <Vignette id="rt-vig" strength={0.6} />
    </svg>
  );
}
