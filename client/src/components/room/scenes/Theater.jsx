import { Vignette, Glow } from '../effectsSvg';

export default function Theater() {
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <rect width="1600" height="1000" fill="#120D12" />
      <Glow id="th-screen" cx={800} cy={320} r={760} color="#8FB3D9" opacity={0.22} />
      <rect x="360" y="110" width="880" height="420" rx="10" fill="#1E2A3E" />
      <rect x="360" y="110" width="880" height="420" rx="10" fill="#8FB3D9" opacity=".25" className="animate-flicker" style={{ animationDuration: '3s' }} />
      <text x="800" y="335" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="46" fill="#F5EBDD" opacity=".6" fontStyle="italic">
        now showing: us
      </text>
      {/* curtains */}
      <path d="M0,0 L380,0 C340,200 360,400 330,640 L0,640 Z" fill="#6E2A36" />
      <path d="M1600,0 L1220,0 C1260,200 1240,400 1270,640 L1600,640 Z" fill="#6E2A36" />
      <g stroke="#561F2A" strokeWidth="8" fill="none">
        <path d="M100,0 C90,200 110,420 90,640 M220,0 C210,200 230,420 210,640" />
        <path d="M1500,0 C1510,200 1490,420 1510,640 M1380,0 C1390,200 1370,420 1390,640" />
      </g>
      <path d="M0,0 L1600,0 L1600,70 Q800,120 0,70 Z" fill="#7A2E3F" />
      {/* seats */}
      {[0, 1].map((row) =>
        Array.from({ length: 9 }, (_, i) => {
          const x = 120 + i * 170 + row * 40;
          const y = 700 + row * 130;
          return (
            <g key={`${row}-${i}`} opacity={row === 0 ? 0.7 : 1}>
              <rect x={x} y={y} width="130" height="110" rx="26" fill="#5A1E2A" />
              <rect x={x + 10} y={y + 60} width="110" height="60" rx="14" fill="#6E2A36" />
            </g>
          );
        }),
      )}
      <Vignette id="th-vig" strength={0.6} />
    </svg>
  );
}
