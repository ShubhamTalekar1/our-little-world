import { StarField } from '../effects';
import { Vignette, Glow } from '../effectsSvg';

export default function Campfire() {
  const sparks = Array.from({ length: 14 }, (_, i) => ({ x: 800 + ((i * 37) % 60) - 30, d: (i * 0.37) % 2.6, dx: ((i * 53) % 60) - 30 }));
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="cp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#080A18" />
          <stop offset="1" stopColor="#1E1A2E" />
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#cp-sky)" />
      <StarField count={120} seed={55} h={500} />
      {/* pines */}
      {Array.from({ length: 14 }, (_, i) => {
        const x = i * 125 - 20;
        const h = 280 + ((i * 71) % 160);
        return <path key={i} d={`M${x},${720 - h} L${x - 70},720 L${x + 70},720 Z`} fill={i % 2 ? '#0C1118' : '#101820'} />;
      })}
      <rect x="0" y="720" width="1600" height="280" fill="#15121A" />
      <Glow id="cp-fire" cx={800} cy={860} r={600} color="#F2A36B" opacity={0.45} />
      {/* logs + fire */}
      <g>
        <rect x="720" y="890" width="160" height="26" rx="13" fill="#4A2E22" transform="rotate(-12 800 903)" />
        <rect x="720" y="890" width="160" height="26" rx="13" fill="#5A3B2C" transform="rotate(12 800 903)" />
        <path className="flame" d="M800,760 C760,820 750,860 770,890 L830,890 C850,860 840,820 800,760 Z" fill="#E8804A" />
        <path className="flame" style={{ animationDelay: '-.4s' }} d="M800,800 C778,840 772,866 786,890 L814,890 C828,866 822,840 800,800 Z" fill="#F2C98B" />
        <path className="flame" style={{ animationDelay: '-.8s' }} d="M760,830 C744,860 748,880 762,892 L786,892 C790,870 780,850 760,830 Z" fill="#D9663C" />
        {sparks.map((s, i) => (
          <circle key={i} cx={s.x} cy="800" r="2.5" fill="#FFD9A8" className="spark" style={{ animationDelay: `${s.d}s`, '--dx': `${s.dx}px` }} />
        ))}
      </g>
      {/* logs to sit on */}
      <rect x="360" y="880" width="260" height="46" rx="23" fill="#3A2620" />
      <rect x="980" y="880" width="260" height="46" rx="23" fill="#3A2620" />
      <Vignette id="cp-vig" strength={0.7} />
    </svg>
  );
}
