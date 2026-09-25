// "Painted" placeholder photos for demo memories — soft illustrated scenes
// instead of stock photography.
const SCENES = {
  sunset: { bg: 'linear-gradient(180deg,#3b2f5c 0%,#b8668a 45%,#f2b98b 75%,#f5dcb0 100%)', parts: 'sun' },
  rain: { bg: 'linear-gradient(180deg,#232a44,#4a5578 70%,#6a7396)', parts: 'rain' },
  city: { bg: 'linear-gradient(180deg,#0f1330,#2b2b4e 70%,#4a3f5e)', parts: 'city' },
  cafe: { bg: 'linear-gradient(180deg,#4a2e22,#8a5a3c 60%,#d9a37f)', parts: 'cup' },
  stars: { bg: 'radial-gradient(circle at 70% 20%,#3a3f6e,#0b0e24 70%)', parts: 'stars' },
  flowers: { bg: 'linear-gradient(180deg,#e9d9c4,#e8b4a0 60%,#9db8a0)', parts: 'flowers' },
  beach: { bg: 'linear-gradient(180deg,#8fb3d9 0%,#c9dcef 45%,#6f94b8 55%,#e7d3b0 75%)', parts: 'wave' },
  film: { bg: 'linear-gradient(135deg,#1c1a2a,#3b2f45)', parts: 'film' },
  cake: { bg: 'linear-gradient(180deg,#f5ebdd,#e8b4a0)', parts: 'cake' },
};
export const MEMORY_SCENES = Object.keys(SCENES);

function Parts({ kind }) {
  switch (kind) {
    case 'sun':
      return (
        <>
          <circle cx="50" cy="62" r="16" fill="#ffe2b0" />
          <path d="M0,70 C20,64 40,72 60,66 C80,62 90,68 100,66 L100,100 L0,100 Z" fill="#2b2238" opacity=".85" />
        </>
      );
    case 'rain':
      return (
        <g stroke="#c8d2f0" strokeWidth=".6" opacity=".6">
          {Array.from({ length: 26 }, (_, i) => (
            <line key={i} x1={(i * 37) % 100} y1={(i * 23) % 80} x2={((i * 37) % 100) - 2} y2={((i * 23) % 80) + 8} />
          ))}
          <rect x="0" y="80" width="100" height="20" fill="#1b2034" stroke="none" />
          <circle cx="30" cy="80" r="10" fill="#f2c98b" opacity=".25" stroke="none" />
        </g>
      );
    case 'city':
      return (
        <>
          {[[0, 55, 14], [16, 45, 12], [30, 60, 16], [48, 38, 10], [60, 52, 18], [80, 42, 20]].map(([x, y, w], i) => (
            <rect key={i} x={x} y={y} width={w} height={100 - y} fill="#11132a" />
          ))}
          {Array.from({ length: 20 }, (_, i) => (
            <rect key={i} x={(i * 17) % 96 + 2} y={50 + ((i * 13) % 40)} width="2" height="2.5" fill="#f2c98b" opacity=".8" />
          ))}
          <circle cx="78" cy="18" r="6" fill="#f5ebdd" />
        </>
      );
    case 'cup':
      return (
        <>
          <ellipse cx="50" cy="78" rx="30" ry="6" fill="#3a2620" opacity=".5" />
          <rect x="34" y="52" width="32" height="26" rx="6" fill="#f5ebdd" />
          <path d="M66,58 q10,3 0,14" stroke="#f5ebdd" strokeWidth="3" fill="none" />
          <path d="M44,46 q-4,-8 2,-14 M54,46 q-4,-8 2,-16" stroke="#f5ebdd" strokeWidth="1.5" fill="none" opacity=".6" />
          <path d="M44,62 c-2,-3 2,-6 6,-2 c4,-4 8,-1 6,2 l-6,6 z" fill="#d98e96" />
        </>
      );
    case 'stars':
      return (
        <>
          {Array.from({ length: 40 }, (_, i) => (
            <circle key={i} cx={(i * 29) % 100} cy={(i * 17) % 70} r={(i % 3) * 0.3 + 0.3} fill="#fff6e8" />
          ))}
          <path d="M0,80 C30,70 60,78 100,72 L100,100 L0,100 Z" fill="#070914" />
          <circle cx="75" cy="22" r="7" fill="#f5ebdd" />
          <circle cx="78" cy="20" r="7" fill="#0b0e24" />
        </>
      );
    case 'flowers':
      return (
        <>
          {[[20, 60, '#d98e96'], [40, 50, '#f5ebdd'], [60, 58, '#b8a7d9'], [78, 48, '#d98e96'], [32, 72, '#f2c98b'], [68, 72, '#f5ebdd']].map(([x, y, c], i) => (
            <g key={i}>
              <line x1={x} y1={y} x2={x} y2="100" stroke="#6e8c70" strokeWidth="1.5" />
              {[0, 72, 144, 216, 288].map((a) => (
                <circle key={a} cx={x + Math.cos((a * Math.PI) / 180) * 3.5} cy={y + Math.sin((a * Math.PI) / 180) * 3.5} r="3" fill={c} />
              ))}
              <circle cx={x} cy={y} r="2" fill="#f2c98b" />
            </g>
          ))}
        </>
      );
    case 'wave':
      return (
        <>
          <circle cx="75" cy="25" r="8" fill="#fff6e8" opacity=".9" />
          <path d="M0,58 q12,-4 25,0 t25,0 t25,0 t25,0" stroke="#fff" strokeWidth="1.2" fill="none" opacity=".7" />
          <path d="M0,68 q12,-3 25,0 t25,0 t25,0 t25,0" stroke="#fff" strokeWidth="1" fill="none" opacity=".5" />
        </>
      );
    case 'film':
      return (
        <>
          <rect x="15" y="25" width="70" height="42" rx="3" fill="#8fb3d9" opacity=".35" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={10 + i * 15} y="78" width="10" height="8" rx="2" fill="#6e2a36" />
          ))}
          <text x="50" y="50" textAnchor="middle" fontSize="8" fill="#f5ebdd" fontFamily="Fraunces, serif" fontStyle="italic">
            the end
          </text>
        </>
      );
    case 'cake':
      return (
        <>
          <rect x="30" y="55" width="40" height="25" rx="4" fill="#fff" />
          <rect x="30" y="55" width="40" height="7" rx="3" fill="#d98e96" />
          <rect x="48" y="42" width="4" height="13" fill="#b8a7d9" />
          <path d="M50,34 c-3,4 -2,7 0,8 c2,-1 3,-4 0,-8 z" fill="#f2c98b" />
          {[[20, 20], [80, 26], [14, 60], [86, 64]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2" fill={i % 2 ? '#b8a7d9' : '#d98e96'} />
          ))}
        </>
      );
    default:
      return null;
  }
}

export default function MemoryPhoto({ memory, className = '' }) {
  if (memory.image) return <img src={memory.image} alt={memory.caption || 'Memory'} className={`h-full w-full object-cover ${className}`} loading="lazy" />;
  const s = SCENES[memory.scene] ?? SCENES.sunset;
  return (
    <div className={`relative h-full w-full ${className}`} style={{ background: s.bg }} role="img" aria-label={memory.caption || 'Painted memory'}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <Parts kind={s.parts} />
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_50%)] mix-blend-soft-light" />
    </div>
  );
}
