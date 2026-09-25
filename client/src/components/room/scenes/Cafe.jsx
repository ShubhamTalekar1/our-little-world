import { SvgRain, Vignette, Glow } from '../effectsSvg';
import { Skyline } from '../effects';

export default function Cafe() {
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="cf-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A1F22" />
          <stop offset="1" stopColor="#3A2A28" />
        </linearGradient>
        <linearGradient id="cf-street" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1A1E33" />
          <stop offset="1" stopColor="#2E2A40" />
        </linearGradient>
        <clipPath id="cf-win">
          <rect x="140" y="110" width="1320" height="500" rx="10" />
        </clipPath>
      </defs>
      <rect width="1600" height="1000" fill="url(#cf-wall)" />
      <g clipPath="url(#cf-win)">
        <rect x="140" y="110" width="1320" height="500" fill="url(#cf-street)" />
        <Skyline y={640} x0={120} width={1360} seed={44} maxH={330} color="#23263D" windowColor="#E8B4A0" />
        {[[380, 520], [900, 540], [1250, 510]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="60" fill="#F2C98B" opacity=".12" />
        ))}
        <SvgRain x={140} y={110} w={1320} h={500} count={120} seed={3} />
        <rect x="140" y="110" width="1320" height="500" fill="#E8B4A0" opacity=".05" />
      </g>
      <rect x="140" y="110" width="1320" height="500" rx="10" fill="none" stroke="#1A1314" strokeWidth="20" />
      {[580, 1020].map((x) => (
        <line key={x} x1={x} y1="110" x2={x} y2="610" stroke="#1A1314" strokeWidth="12" />
      ))}
      <text x="800" y="200" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="54" fill="#F2C98B" opacity=".22" fontStyle="italic">
        café
      </text>
      {/* pendant lamps */}
      {[420, 800, 1180].map((x, i) => (
        <g key={x}>
          <line x1={x} y1="0" x2={x} y2="120" stroke="#1A1314" strokeWidth="3" />
          <path d={`M${x - 46},170 Q${x},100 ${x + 46},170 Z`} fill="#B8664A" />
          <Glow id={`cf-g${i}`} cx={x} cy={200} r={260} opacity={0.35} />
          <ellipse cx={x} cy="172" rx="20" ry="6" fill="#FFE2A8" />
        </g>
      ))}
      {/* counter / table */}
      <rect x="0" y="720" width="1600" height="280" fill="#241A1B" />
      <rect x="0" y="700" width="1600" height="30" fill="#5A3B2C" />
      <rect x="560" y="780" width="480" height="24" rx="12" fill="#6B432E" />
      <rect x="788" y="800" width="24" height="200" fill="#4A2E22" />
      {[700, 900].map((x, i) => (
        <g key={x}>
          <rect x={x - 26} y="740" width="52" height="42" rx="8" fill="#F5EBDD" />
          <path d={`M${x + 26},750 q18,4 0,22`} stroke="#F5EBDD" strokeWidth="6" fill="none" />
          <path d={`M${x - 8},730 q-10,-20 4,-36 M${x + 8},730 q-10,-22 4,-40`} stroke="#F5EBDD" strokeWidth="3" fill="none" opacity=".35" className="animate-flicker" style={{ animationDelay: `${i}s` }} />
        </g>
      ))}
      <Vignette id="cf-vig" strength={0.6} />
    </svg>
  );
}
