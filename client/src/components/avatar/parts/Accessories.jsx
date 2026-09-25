import { shade } from '../../../lib/color';
import { EYES } from '../geometry';

export function Glasses({ item }) {
  if (!item) return null;
  const c = item.color;
  const { y, lx, rx } = EYES;
  if (item.style === 'sun' || item.style === 'heart') {
    const lens = item.style === 'heart'
      ? (x) => `M${x},${y + 8} C${x - 12},${y} ${x - 10},${y - 9} ${x - 4},${y - 8} C${x - 1},${y - 8} ${x},${y - 5} ${x},${y - 4} C${x},${y - 5} ${x + 1},${y - 8} ${x + 4},${y - 8} C${x + 10},${y - 9} ${x + 12},${y} ${x},${y + 8} Z`
      : (x) => `M${x - 11},${y - 6} L${x + 11},${y - 6} Q${x + 11},${y + 8} ${x},${y + 8} Q${x - 11},${y + 8} ${x - 11},${y - 6} Z`;
    return (
      <g>
        <path d={lens(lx)} fill={c} />
        <path d={lens(rx)} fill={c} />
        <path d={`M${lx + 10},${y - 4} Q100,${y - 8} ${rx - 10},${y - 4}`} stroke={shade(c, -0.2)} strokeWidth="2" fill="none" />
        <path d={`M${lx - 6},${y - 3} l4,0 M${rx - 6},${y - 3} l4,0`} stroke="#fff" strokeWidth="1.5" opacity=".45" strokeLinecap="round" />
      </g>
    );
  }
  const frame = { stroke: c, strokeWidth: 2.2, fill: 'rgba(255,255,255,0.08)' };
  return (
    <g>
      {item.style === 'square' ? (
        <>
          <rect x={lx - 11} y={y - 8} width="22" height="16" rx="4" {...frame} />
          <rect x={rx - 11} y={y - 8} width="22" height="16" rx="4" {...frame} />
        </>
      ) : (
        <>
          <circle cx={lx} cy={y} r="10.5" {...frame} />
          <circle cx={rx} cy={y} r="10.5" {...frame} />
        </>
      )}
      <path d={`M${lx + 10},${y - 2} Q100,${y - 6} ${rx - 10},${y - 2}`} stroke={c} strokeWidth="2" fill="none" />
    </g>
  );
}

export function Hat({ item }) {
  if (!item) return null;
  const c = item.color;
  const dark = shade(c, -0.2);
  switch (item.style) {
    case 'beanie':
      return (
        <g>
          <path d="M51,74 C51,38 78,24 100,24 C122,24 149,38 149,74 Z" fill={c} />
          <rect x="48" y="66" width="104" height="16" rx="8" fill={dark} />
          <g stroke={shade(c, -0.35)} strokeWidth="1" opacity=".5">
            {[60, 72, 84, 96, 108, 120, 132, 144].map((x) => (
              <path key={x} d={`M${x},68 L${x},80`} />
            ))}
          </g>
          <circle cx="100" cy="22" r="9" fill={shade(c, 0.35)} />
        </g>
      );
    case 'cap':
      return (
        <g>
          <path d="M54,70 C54,38 78,30 100,30 C122,30 146,38 146,70 Z" fill={c} />
          <path d="M100,70 L164,70 Q168,78 152,80 L100,78 Z" fill={dark} />
          <path d="M100,31 L100,70" stroke={dark} strokeWidth="1" opacity=".6" />
          <circle cx="100" cy="31" r="3" fill={dark} />
        </g>
      );
    case 'beret':
      return (
        <g>
          <ellipse cx="94" cy="46" rx="50" ry="17" transform="rotate(-10 94 46)" fill={c} />
          <path d="M60,58 Q100,64 136,50" stroke={dark} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M92,30 l2,-6" stroke={c} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case 'sunhat':
      return (
        <g>
          <ellipse cx="100" cy="60" rx="78" ry="15" fill={c} />
          <path d="M62,60 C62,30 80,22 100,22 C120,22 138,30 138,60 Z" fill={shade(c, 0.08)} />
          <path d="M63,52 Q100,60 137,52 L138,60 Q100,66 62,60 Z" fill={item.accent} />
          <g stroke={dark} strokeWidth=".8" opacity=".35">
            <path d="M30,60 Q100,70 170,60" fill="none" />
            <path d="M40,54 Q100,62 160,54" fill="none" />
          </g>
        </g>
      );
    case 'flowers':
      return (
        <g>
          <path d="M56,62 Q100,40 144,62" stroke="#8FA890" strokeWidth="3" fill="none" />
          {[[58, 60, c], [72, 52, item.accent], [86, 47, '#F5EBDD'], [100, 45, c], [114, 47, item.accent], [128, 52, '#F5EBDD'], [142, 60, c]].map(([x, y, col], i) => (
            <g key={i} transform={`translate(${x},${y})`}>
              {[0, 72, 144, 216, 288].map((a) => (
                <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 3.6} cy={Math.sin((a * Math.PI) / 180) * 3.6} r="3.2" fill={col} />
              ))}
              <circle r="2" fill="#F2C98B" />
            </g>
          ))}
        </g>
      );
    default:
      return null;
  }
}

export function Earrings({ item }) {
  if (!item) return null;
  const c = item.color;
  const one = (x) => {
    switch (item.style) {
      case 'hoops':
        return <circle key={x} cx={x} cy="108" r="5" stroke={c} strokeWidth="1.8" fill="none" />;
      case 'pearls':
        return (
          <g key={x}>
            <path d={`M${x},101 L${x},106`} stroke="#E8C27A" strokeWidth="1" />
            <circle cx={x} cy="108.5" r="3" fill={c} />
          </g>
        );
      default:
        return <circle key={x} cx={x} cy="102" r="2" fill={c} />;
    }
  };
  return <g>{[56, 144].map(one)}</g>;
}

export function Necklace({ item }) {
  if (!item) return null;
  const c = item.color;
  if (item.style === 'pearls') {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const x = 88 + 24 * t;
      const y = 140 + Math.sin(t * Math.PI) * 9;
      pts.push([x, y]);
    }
    return (
      <g fill={c}>
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.8" />
        ))}
      </g>
    );
  }
  return (
    <g>
      <path d="M89,139 Q100,154 111,139" stroke={c} strokeWidth="1.2" fill="none" />
      {item.style === 'pendant' && (
        <path d="M100,152 C97,149 96,147 98,146 C99,145.5 100,146.5 100,147 C100,146.5 101,145.5 102,146 C104,147 103,149 100,152 Z" fill={c} />
      )}
    </g>
  );
}

export function Bag({ item, dims }) {
  if (!item) return null;
  const c = item.color;
  const { sw, hw } = dims;
  if (item.style === 'tote') {
    return (
      <g>
        <path d={`M${100 + sw - 6},142 L${100 + sw + 2},196`} stroke={shade(c, -0.2)} strokeWidth="2.5" />
        <path d={`M${100 + sw - 8},190 L${100 + sw + 18},190 L${100 + sw + 16},218 L${100 + sw - 6},218 Z`} fill={c} />
        <circle cx={100 + sw + 5} cy="204" r="4" fill={item.accent} />
      </g>
    );
  }
  return (
    <g>
      <path d={`M${100 + sw - 7},141 L${100 - hw + 2},200`} stroke={shade(c, -0.25)} strokeWidth="2.5" />
      <rect x={100 - hw - 12} y="196" width="22" height="17" rx="5" fill={c} />
      <path d={`M${100 - hw - 12},202 L${100 - hw + 10},202`} stroke={shade(c, -0.2)} strokeWidth="1.5" />
      <circle cx={100 - hw - 1} cy="205" r="1.4" fill="#E8C27A" />
    </g>
  );
}
