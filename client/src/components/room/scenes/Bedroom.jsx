import { StarField, Skyline, WallClock } from '../effects';
import { SvgRain, Vignette, Glow } from '../effectsSvg';

export default function Bedroom({ night = true }) {
  return (
    <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="bd-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1A1A2B" />
          <stop offset="1" stopColor="#262235" />
        </linearGradient>
        <linearGradient id="bd-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={night ? '#0C1026' : '#6E88B8'} />
          <stop offset="1" stopColor={night ? '#2B2B4E' : '#C9B8E6'} />
        </linearGradient>
        <linearGradient id="bd-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A2A2A" />
          <stop offset="1" stopColor="#1E1618" />
        </linearGradient>
        <linearGradient id="bd-couch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8B6560" />
          <stop offset="1" stopColor="#6A4A48" />
        </linearGradient>
        <clipPath id="bd-window">
          <rect x="540" y="130" width="520" height="410" rx="6" />
        </clipPath>
      </defs>

      <rect width="1600" height="1000" fill="url(#bd-wall)" />
      {/* subtle wallpaper */}
      <g opacity=".035" stroke="#F5EBDD">
        {Array.from({ length: 40 }, (_, i) => (
          <line key={i} x1={i * 40} y1="0" x2={i * 40} y2="760" />
        ))}
      </g>
      <Glow id="bd-lampglow" cx="1380" cy="520" r="520" opacity={0.28} />

      {/* window */}
      <g clipPath="url(#bd-window)">
        <rect x="540" y="130" width="520" height="410" fill="url(#bd-sky)" />
        <StarField count={50} seed={4} x={540} y={130} w={520} h={260} maxR={1.3} />
        <circle cx="940" cy="210" r="34" fill="#F5EBDD" opacity=".95" />
        <circle cx="940" cy="210" r="70" fill="#F5EBDD" opacity=".07" />
        <Skyline y={560} x0={530} width={560} maxH={200} seed={8} color="#161729" />
        <SvgRain x={540} y={130} w={520} h={410} count={55} />
      </g>
      <rect x="540" y="130" width="520" height="410" rx="6" fill="none" stroke="#3B2C2A" strokeWidth="18" />
      <line x1="800" y1="130" x2="800" y2="540" stroke="#3B2C2A" strokeWidth="10" />
      <line x1="540" y1="335" x2="1060" y2="335" stroke="#3B2C2A" strokeWidth="10" />
      <rect x="515" y="540" width="570" height="22" rx="4" fill="#4A3833" />
      {/* condensation glow on glass */}
      <rect x="540" y="130" width="520" height="410" fill="#B8A7D9" opacity=".04" />

      {/* curtains */}
      <g className="sway" style={{ animationDuration: '9s' }}>
        <path d="M430,90 L560,90 C548,260 572,420 548,640 L452,640 C440,440 420,260 430,90 Z" fill="#5A4B72" />
        <path d="M470,95 C466,260 480,420 470,640 M515,95 C508,260 526,430 512,640" stroke="#473A5E" strokeWidth="6" fill="none" />
      </g>
      <g className="sway" style={{ animationDuration: '11s', animationDelay: '-3s' }}>
        <path d="M1040,90 L1170,90 C1180,260 1160,440 1148,640 L1052,640 C1028,420 1052,260 1040,90 Z" fill="#5A4B72" />
        <path d="M1085,95 C1092,260 1074,430 1088,640 M1130,95 C1134,260 1120,420 1130,640" stroke="#473A5E" strokeWidth="6" fill="none" />
      </g>
      <rect x="410" y="80" width="780" height="14" rx="7" fill="#6B4A3A" />

      {/* bookshelf */}
      <g>
        <rect x="120" y="300" width="250" height="470" rx="8" fill="#3B2C2A" />
        {[380, 500, 620].map((y) => (
          <rect key={y} x="130" y={y} width="230" height="10" fill="#2B201F" />
        ))}
        {[
          [140, 318, '#B8664A'], [168, 330, '#9DB8A0'], [190, 322, '#E8B4A0'], [214, 336, '#5A4B72'], [236, 326, '#EFD58F'], [290, 330, '#8FB3D9'], [314, 318, '#D98E96'],
          [140, 448, '#5A4B72'], [166, 440, '#E8B4A0'], [192, 452, '#9DB8A0'], [260, 444, '#B8664A'], [286, 440, '#F5EBDD'], [312, 450, '#8FB3D9'],
          [146, 560, '#EFD58F'], [172, 568, '#D98E96'], [198, 556, '#5A4B72'], [226, 564, '#9DB8A0'],
        ].map(([x, y, c], i) => (
          <rect key={i} x={x} y={y} width="22" height={(y > 540 ? 620 : y > 420 ? 500 : 380) - y} rx="3" fill={c} opacity=".85" />
        ))}
        <circle cx="300" cy="590" r="22" fill="#9DB8A0" />
        <rect x="286" y="596" width="28" height="24" rx="4" fill="#B8664A" />
      </g>

      <WallClock cx={1330} cy={240} r={40} />

      {/* floor */}
      <rect x="0" y="760" width="1600" height="240" fill="url(#bd-floor)" />
      <g stroke="#000" opacity=".25">
        {[800, 850, 910, 980].map((y) => (
          <line key={y} x1="0" y1={y} x2="1600" y2={y} />
        ))}
      </g>
      <rect x="0" y="752" width="1600" height="12" fill="#2B201F" />
      <ellipse cx="800" cy="905" rx="560" ry="70" fill="#4A3F5E" opacity=".75" />
      <ellipse cx="800" cy="905" rx="520" ry="58" fill="none" stroke="#B8A7D9" strokeOpacity=".25" strokeWidth="3" strokeDasharray="10 12" />

      {/* couch */}
      <g>
        <rect x="500" y="610" width="600" height="120" rx="40" fill="url(#bd-couch)" />
        <rect x="470" y="660" width="80" height="120" rx="32" fill="#7A5754" />
        <rect x="1050" y="660" width="80" height="120" rx="32" fill="#7A5754" />
        <rect x="530" y="700" width="540" height="70" rx="20" fill="#8B6560" />
        <rect x="560" y="630" width="120" height="80" rx="26" fill="#E8B4A0" opacity=".85" transform="rotate(-8 620 670)" />
        <rect x="920" y="630" width="120" height="80" rx="26" fill="#B8A7D9" opacity=".85" transform="rotate(7 980 670)" />
        <path d="M600,700 Q800,680 1010,705 L1010,760 L600,760 Z" fill="#F5EBDD" opacity=".16" />
      </g>

      <Vignette id="bd-vig" />
    </svg>
  );
}
