import { StarField } from '../effects';
import { Vignette } from '../effectsSvg';

export default function Stargazing() {
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="sg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#05061A" />
          <stop offset=".7" stopColor="#141A3A" />
          <stop offset="1" stopColor="#2A2A50" />
        </linearGradient>
        <linearGradient id="sg-milky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B8A7D9" stopOpacity="0" />
          <stop offset=".5" stopColor="#B8A7D9" stopOpacity=".22" />
          <stop offset="1" stopColor="#E8B4A0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#sg-sky)" />
      <path d="M-100,650 C300,420 900,260 1700,-50 L1700,150 C900,420 400,620 -100,820 Z" fill="url(#sg-milky)" />
      <StarField count={240} seed={77} h={800} maxR={1.6} />
      <StarField count={30} seed={78} h={600} maxR={2.6} />
      {[0, 4.5].map((delay, i) => (
        <g key={i} className="shooting-star" style={{ animationDelay: `${delay}s`, animationDuration: `${9 + i * 3}s` }}>
          <line x1={1100 + i * 300} y1={100 + i * 40} x2={1170 + i * 300} y2={65 + i * 40} stroke="#FFF6E8" strokeWidth="2" strokeLinecap="round" />
        </g>
      ))}
      <path d="M0,760 C300,690 600,720 900,700 C1200,680 1400,720 1600,700 L1600,1000 L0,1000 Z" fill="#101428" />
      <path d="M0,820 C400,780 800,800 1600,790 L1600,1000 L0,1000 Z" fill="#0B0E1E" />
      {/* tree silhouettes */}
      {[120, 210, 1420, 1500].map((x, i) => (
        <path key={x} d={`M${x},${760 - i * 5} l-40,80 l25,0 l-45,70 l30,0 l-50,80 l160,0 l-50,-80 l30,0 l-45,-70 l25,0 Z`} fill="#070914" transform={`translate(${-40 + (i % 2) * 20},${-60})`} />
      ))}
      <path d="M520,880 L1080,880 L1120,960 L480,960 Z" fill="#8FB3D9" opacity=".35" />
      <Vignette id="sg-vig" strength={0.5} />
    </svg>
  );
}
