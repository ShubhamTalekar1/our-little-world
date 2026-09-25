import { Vignette } from '../effectsSvg';

export default function Beach() {
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="bc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2B2750" />
          <stop offset=".45" stopColor="#8B5A7A" />
          <stop offset=".75" stopColor="#E8A07C" />
          <stop offset="1" stopColor="#F2C98B" />
        </linearGradient>
        <linearGradient id="bc-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B87A7E" />
          <stop offset="1" stopColor="#3A3458" />
        </linearGradient>
        <linearGradient id="bc-sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C89A7A" />
          <stop offset="1" stopColor="#6E4E48" />
        </linearGradient>
        <radialGradient id="bc-sun">
          <stop offset="0" stopColor="#FFE2B0" />
          <stop offset=".5" stopColor="#F2B98B" stopOpacity=".6" />
          <stop offset="1" stopColor="#F2B98B" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#bc-sky)" />
      <circle cx="800" cy="560" r="260" fill="url(#bc-sun)" />
      <circle cx="800" cy="560" r="90" fill="#FFD9A8" />
      {[[200, 180, 1], [1100, 140, 1.3], [620, 260, 0.8]].map(([x, y, s], i) => (
        <g key={i} style={{ animation: `cloud-drift ${120 + i * 40}s linear infinite`, animationDelay: `${-i * 30}s` }} opacity=".35">
          <ellipse cx={x} cy={y} rx={120 * s} ry={22 * s} fill="#F5D5C8" />
          <ellipse cx={x + 60 * s} cy={y - 14 * s} rx={70 * s} ry={20 * s} fill="#F5D5C8" />
        </g>
      ))}
      <rect x="0" y="560" width="1600" height="220" fill="url(#bc-sea)" />
      <g stroke="#FFE2B0" strokeLinecap="round">
        {[[700, 590, 200], [760, 620, 90], [650, 650, 260], [720, 690, 150], [600, 730, 340]].map(([x, y, w], i) => (
          <line key={i} x1={x} y1={y} x2={x + w} y2={y} strokeWidth="3" className="shimmer" style={{ animationDelay: `${i * 0.7}s` }} />
        ))}
      </g>
      <path d="M0,770 C300,740 500,790 800,770 C1100,750 1300,790 1600,765 L1600,1000 L0,1000 Z" fill="url(#bc-sand)" />
      <path d="M0,772 C300,742 500,792 800,772 C1100,752 1300,792 1600,767" stroke="#F5EBDD" strokeWidth="5" fill="none" opacity=".5" />
      {/* palm */}
      <g className="sway" style={{ animationDuration: '7s' }}>
        <path d="M1380,1000 C1370,860 1390,720 1440,560" stroke="#3A2A2E" strokeWidth="22" fill="none" />
        {[[-150, -20], [-110, 50], [40, -70], [120, 10], [-40, -90]].map(([dx, dy], i) => (
          <path key={i} d={`M1440,560 Q${1440 + dx * 0.6},${560 + dy - 40} ${1440 + dx},${560 + dy + 30}`} stroke="#2E2A3A" strokeWidth="18" fill="none" strokeLinecap="round" />
        ))}
      </g>
      <path d="M500,900 L1100,900 L1140,970 L460,970 Z" fill="#F5EBDD" opacity=".5" />
      <path d="M500,900 L1100,900" stroke="#D98E96" strokeWidth="10" opacity=".5" />
      <Vignette id="bc-vig" strength={0.45} />
    </svg>
  );
}
