import { shade } from '../../../lib/color';

// Curly hair is built from little circles around the head.
function curls(radius, from, to, step, r, cy = 86) {
  const out = [];
  for (let a = from; a <= to; a += step) {
    const rad = (a * Math.PI) / 180;
    out.push([100 + Math.cos(rad) * radius, cy + Math.sin(rad) * radius, r]);
  }
  return out;
}

const BACK = {
  long: 'M50,90 C46,42 78,30 100,30 C122,30 154,42 150,90 L155,194 Q128,204 100,199 Q72,204 45,194 Z',
  wavy: 'M50,88 C44,40 80,30 100,30 C120,30 156,40 150,88 C160,110 146,130 156,150 C164,170 150,186 156,200 Q128,210 100,204 Q72,210 44,200 C50,186 36,170 44,150 C54,130 40,110 50,88 Z',
  bob: 'M48,90 C44,42 78,31 100,31 C122,31 156,42 152,90 L154,134 Q128,144 100,140 Q72,144 46,134 Z',
  ponytail: 'M54,84 C54,50 76,36 100,36 C124,36 146,50 146,84 Z',
};

const FRONT = {
  short:
    'M54,90 C50,50 78,34 104,35 C130,36 150,54 146,90 C142,72 134,63 120,59 C108,66 88,65 72,61 C64,67 58,77 54,90 Z',
  sidepart:
    'M54,92 C50,48 80,32 104,34 C132,36 152,54 146,92 C144,72 136,60 124,56 C112,60 94,64 80,62 C68,64 59,76 54,92 Z',
  messy:
    'M52,92 C46,46 80,28 106,32 C134,34 154,56 148,92 C145,78 139,69 134,65 L129,76 L122,61 L113,73 L104,59 L95,73 L86,61 L79,75 L71,65 C62,71 56,81 52,92 Z',
  buzz: 'M56,82 C56,52 78,41 100,41 C122,41 144,52 144,82 C138,65 124,57 100,57 C76,57 62,65 56,82 Z',
  bob: 'M53,96 C49,48 76,33 100,33 C124,33 151,48 147,96 L145,73 Q124,64 100,66 Q76,64 55,73 Z',
  long:
    'M54,98 C50,50 80,33 102,33 C126,33 150,50 146,100 C142,80 134,66 124,60 C112,70 90,77 66,75 C60,81 56,88 54,98 Z',
  wavy: 'M54,98 C50,50 78,34 100,36 C122,34 150,50 146,98 C142,72 124,56 100,50 C76,56 58,72 54,98 Z',
};

export function HairBack({ style, color }) {
  const dark = shade(color, -0.25);
  if (style === 'curly') {
    return (
      <g fill={color}>
        {curls(50, 150, 390, 22, 16, 92).map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
        <circle cx="100" cy="86" r="50" />
      </g>
    );
  }
  if (style === 'buns') {
    return (
      <g>
        <circle cx="66" cy="46" r="17" fill={color} />
        <circle cx="134" cy="46" r="17" fill={color} />
        <path d="M58,40 Q66,34 74,40" stroke={dark} strokeWidth="1.5" fill="none" opacity=".5" />
        <path d="M126,40 Q134,34 142,40" stroke={dark} strokeWidth="1.5" fill="none" opacity=".5" />
        <path d={BACK.ponytail} fill={color} />
      </g>
    );
  }
  if (style === 'ponytail') {
    return (
      <g>
        <path d={BACK.ponytail} fill={color} />
        <path
          d="M128,50 C158,44 172,78 166,118 C163,142 156,158 146,172 C150,140 152,112 140,86 Z"
          fill={color}
        />
        <path d="M134,58 C156,62 162,96 156,130" stroke={dark} strokeWidth="1.5" fill="none" opacity=".35" />
        <ellipse cx="132" cy="54" rx="6" ry="4" fill={shade(color, 0.3)} />
      </g>
    );
  }
  const d = BACK[style];
  if (!d) return null;
  return (
    <g>
      <path d={d} fill={color} />
      <path d={d} fill="url(#hairShade)" opacity=".5" />
    </g>
  );
}

export function HairFront({ style, color }) {
  const light = shade(color, 0.28);
  if (style === 'curly') {
    return (
      <g fill={color}>
        {curls(44, 190, 350, 20, 13).map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
        <circle cx="86" cy="54" r="12" fill={light} opacity=".25" />
      </g>
    );
  }
  const key = style === 'buns' ? 'bob' : style === 'ponytail' ? 'long' : style;
  const d = FRONT[key];
  if (!d) return null;
  return (
    <g>
      <path d={d} fill={color} />
      {style !== 'buzz' && (
        <path d="M72,50 Q90,40 110,42" stroke={light} strokeWidth="3" strokeLinecap="round" fill="none" opacity=".35" />
      )}
    </g>
  );
}
