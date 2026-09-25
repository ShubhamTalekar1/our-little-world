import { shade } from '../../../lib/color';
import { torsoPath, hipPath, legPath, footCenter } from '../geometry';

const SLEEVES = {
  tee: 'short',
  blouse: 'puff',
  tank: 'none',
  shirt: 'long',
  hoodie: 'long',
  sweater: 'long',
  pajama: 'long',
  jacket: 'long',
  blazer: 'long',
  cardigan: 'long',
  puffer: 'puffy',
  kimono: 'wide',
  sundress: 'none',
  evening: 'none',
  knit: 'long',
  floral: 'puff',
};

/** Which sleeve the arm should wear, from outermost layer inwards. */
export function sleeveFor({ top, outer, dress }) {
  const layer = outer || dress || top;
  if (!layer) return { length: 'none' };
  // A sleeveless outer layer never happens; but a sleeveless dress under a
  // jacket should still show jacket sleeves — hence outer first.
  return { length: SLEEVES[layer.style] ?? 'short', color: layer.color, accent: layer.accent, style: layer.style };
}

export function Bottom({ item, dims }) {
  if (!item) return null;
  const c = item.color;
  const dark = shade(c, -0.18);
  const hips = <path d={hipPath(dims)} fill={c} />;

  if (item.style === 'skirt') {
    const { ww, hw } = dims;
    return (
      <g>
        <path d={`M${100 - ww},192 L${100 + ww},192 L${100 + hw + 12},238 Q100,244 ${100 - hw - 12},238 Z`} fill={c} />
        <path d={`M100,196 L100,240 M${100 - hw / 2},196 L${100 - hw},238 M${100 + hw / 2},196 L${100 + hw},238`} stroke={dark} strokeWidth="1" opacity=".5" />
        <rect x={100 - ww} y="191" width={ww * 2} height="5" fill={dark} />
      </g>
    );
  }
  if (item.style === 'shorts') {
    return (
      <g>
        {hips}
        <path d={legPath(dims, -1, 206, 228)} fill={c} />
        <path d={legPath(dims, 1, 206, 228)} fill={c} />
        <path d="M100,198 L100,216" stroke={dark} strokeWidth="1.2" />
      </g>
    );
  }
  const cuffs = item.style === 'sweats' || item.style === 'pajama';
  return (
    <g>
      {hips}
      <path d={legPath(dims, -1, 206, 267)} fill={c} />
      <path d={legPath(dims, 1, 206, 267)} fill={c} />
      <path d="M100,198 L100,214" stroke={dark} strokeWidth="1.2" />
      {item.style === 'jeans' && (
        <g stroke={shade(c, 0.25)} strokeWidth="1" opacity=".55" fill="none">
          <path d={`M${100 - dims.hw + 4},200 Q${100 - dims.hw / 2},206 ${100 - 4},200`} />
          <path d={`M${100 + dims.hw - 4},200 Q${100 + dims.hw / 2},206 ${100 + 4},200`} />
        </g>
      )}
      {item.style === 'pants' && (
        <g stroke={dark} strokeWidth="1" opacity=".5">
          <path d={`M${100 - dims.hw / 2 - 1},212 L${100 - dims.hw / 2 + 1},266`} />
          <path d={`M${100 + dims.hw / 2 + 1},212 L${100 + dims.hw / 2 - 1},266`} />
        </g>
      )}
      {cuffs && (
        <g fill={item.accent ?? dark}>
          <rect x={100 - dims.hw + 7} y="262" width={dims.hw - 10} height="5" rx="2" />
          <rect x={103} y="262" width={dims.hw - 10} height="5" rx="2" />
        </g>
      )}
      {item.style === 'pajama' && <PatternDots x={100 - dims.hw} y={210} w={dims.hw * 2} h={50} color={item.accent} />}
    </g>
  );
}

function PatternDots({ x, y, w, h, color = '#fff' }) {
  const dots = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) dots.push([x + 6 + (w - 12) * (j / 2) + (i % 2) * 4, y + 6 + (h - 12) * (i / 3)]);
  return (
    <g fill={color} opacity=".7">
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.3" />
      ))}
    </g>
  );
}

export function Top({ item, dims, skin }) {
  if (!item) return null;
  const c = item.color;
  const dark = shade(c, -0.2);
  const torso = torsoPath(dims);
  const { sw, ww } = dims;
  switch (item.style) {
    case 'tank':
      return (
        <g>
          <path d={`M${100 - sw + 8},150 L${100 - sw + 10},140 L${100 - 12},140 Q100,152 ${100 + 12},140 L${100 + sw - 10},140 L${100 + sw - 8},150 L${100 + ww},200 L${100 - ww},200 Z`} fill={c} />
        </g>
      );
    case 'shirt':
      return (
        <g>
          <path d={torso} fill={c} />
          <path d="M91,139 L100,152 L109,139 L106,137 L100,146 L94,137 Z" fill={shade(c, -0.08)} />
          <path d="M100,152 L100,198" stroke={dark} strokeWidth="1" />
          {[160, 172, 184].map((y) => (
            <circle key={y} cx="102.5" cy={y} r="1.2" fill={dark} />
          ))}
        </g>
      );
    case 'hoodie':
      return (
        <g>
          <path d={torso} fill={c} />
          <path d={`M${100 - 17},142 Q100,160 ${100 + 17},142 Q${100 + 16},134 100,134 Q${100 - 16},134 ${100 - 17},142 Z`} fill={dark} opacity=".6" />
          <path d="M95,148 L94,166 M105,148 L106,166" stroke={shade(c, 0.4)} strokeWidth="1.4" strokeLinecap="round" />
          <path d={`M${100 - 15},178 L${100 + 15},178 L${100 + 18},196 L${100 - 18},196 Z`} fill={dark} opacity=".35" />
          <rect x={100 - ww} y="194" width={ww * 2} height="6" rx="2" fill={dark} opacity=".5" />
        </g>
      );
    case 'sweater':
      return (
        <g>
          <path d={torso} fill={c} />
          <path d="M90,139 Q100,147 110,139" stroke={dark} strokeWidth="3" fill="none" />
          <rect x={100 - ww} y="193" width={ww * 2} height="7" rx="2" fill={dark} opacity=".6" />
          <g stroke={dark} strokeWidth="1" opacity=".35">
            <path d="M92,150 L92,190 M100,150 L100,190 M108,150 L108,190" strokeDasharray="2 3" />
          </g>
        </g>
      );
    case 'blouse':
      return (
        <g>
          <path d={torso} fill={c} />
          <path d="M92,139 L100,152 L108,139 Z" fill={skin} />
          <path d={`M${100 - ww},186 Q100,192 ${100 + ww},186`} stroke={dark} strokeWidth="1" fill="none" opacity=".5" />
        </g>
      );
    case 'pajama':
      return (
        <g>
          <path d={torso} fill={c} />
          <path d="M92,139 L100,150 L108,139" stroke={item.accent} strokeWidth="2" fill="none" />
          <path d="M100,150 L100,198" stroke={item.accent} strokeWidth="1.5" />
          <PatternDots x={100 - sw + 6} y={150} w={sw * 2 - 12} h={40} color={item.accent} />
        </g>
      );
    default:
      // tee
      return (
        <g>
          <path d={torso} fill={c} />
          <path d="M91,139 Q100,148 109,139" stroke={dark} strokeWidth="2" fill="none" />
        </g>
      );
  }
}

export function Outer({ item, dims }) {
  if (!item) return null;
  const c = item.color;
  const dark = shade(c, -0.22);
  const { sw, ww } = dims;
  const left = `M${100 - sw},152 Q${100 - sw},140 ${100 - sw + 11},139 L93,139 L96,202 L${100 - ww - 1},202 Z`;
  const right = `M${100 + sw},152 Q${100 + sw},140 ${100 + sw - 11},139 L107,139 L104,202 L${100 + ww + 1},202 Z`;
  switch (item.style) {
    case 'puffer':
      return (
        <g>
          <path d={`M${100 - sw - 3},152 Q${100 - sw - 3},137 ${100 - sw + 10},136 L${100 + sw - 10},136 Q${100 + sw + 3},137 ${100 + sw + 3},152 L${100 + ww + 4},204 L${100 - ww - 4},204 Z`} fill={c} />
          <g stroke={dark} strokeWidth="1.3" opacity=".55">
            {[152, 166, 180, 194].map((y) => (
              <path key={y} d={`M${100 - sw},${y} Q100,${y + 3} ${100 + sw},${y}`} fill="none" />
            ))}
            <path d="M100,138 L100,204" />
          </g>
          <path d="M88,138 Q100,130 112,138 L112,144 Q100,138 88,144 Z" fill={dark} />
        </g>
      );
    case 'kimono':
      return (
        <g>
          <path d={`M${100 - sw},152 Q${100 - sw},140 ${100 - sw + 11},139 L94,139 L97,232 L${100 - ww - 8},232 Z`} fill={c} />
          <path d={`M${100 + sw},152 Q${100 + sw},140 ${100 + sw - 11},139 L106,139 L103,232 L${100 + ww + 8},232 Z`} fill={c} />
          <g fill={item.accent} opacity=".85">
            {[[82, 160], [86, 190], [80, 214], [118, 170], [114, 200], [120, 222]].map(([x, y]) => (
              <g key={`${x}${y}`} transform={`translate(${x},${y})`}>
                <circle r="2.2" cx="0" cy="-2.5" />
                <circle r="2.2" cx="2.4" cy="0" />
                <circle r="2.2" cx="0" cy="2.5" />
                <circle r="2.2" cx="-2.4" cy="0" />
              </g>
            ))}
          </g>
          <path d="M94,139 L97,232 M106,139 L103,232" stroke={item.accent} strokeWidth="2.5" />
        </g>
      );
    case 'blazer':
      return (
        <g>
          <path d={left} fill={c} />
          <path d={right} fill={c} />
          <path d="M93,139 L86,160 L95,170 Z M107,139 L114,160 L105,170 Z" fill={dark} />
          <circle cx="97" cy="182" r="1.6" fill={shade(c, 0.3)} />
          <path d={`M${100 - sw + 8},176 L${100 - sw + 16},176`} stroke={dark} strokeWidth="1.5" />
        </g>
      );
    case 'cardigan':
      return (
        <g>
          <path d={left} fill={c} />
          <path d={right} fill={c} />
          {[156, 170, 184].map((y) => (
            <circle key={y} cx="94.5" cy={y} r="1.5" fill={dark} />
          ))}
          <path d={`M${100 - ww - 1},196 L96,196 M104,196 L${100 + ww + 1},196`} stroke={dark} strokeWidth="4" opacity=".5" />
        </g>
      );
    default:
      // jacket
      return (
        <g>
          <path d={left} fill={c} />
          <path d={right} fill={c} />
          <path d="M93,139 L84,150 L92,154 Z M107,139 L116,150 L108,154 Z" fill={dark} />
          <path d={`M${100 - sw + 7},164 L${100 - 11},164 M${100 + 11},164 L${100 + sw - 7},164`} stroke={dark} strokeWidth="1.3" />
          <path d={`M${100 - ww - 1},196 L96,196 M104,196 L${100 + ww + 1},196`} stroke={dark} strokeWidth="3" />
        </g>
      );
  }
}

export function Dress({ item, dims, skin }) {
  if (!item) return null;
  const c = item.color;
  const dark = shade(c, -0.2);
  const { sw, ww, hw } = dims;
  const long = item.style === 'evening';
  const hem = long ? 262 : 242;
  const flare = long ? 10 : 15;
  const skirt = `M${100 - ww},194 L${100 + ww},194 L${100 + hw + flare},${hem} Q100,${hem + 6} ${100 - hw - flare},${hem} Z`;
  const strapped = item.style === 'evening' || item.style === 'sundress';
  const bodice = strapped
    ? `M${100 - sw + 9},152 L${100 - 14},146 Q100,154 ${100 + 14},146 L${100 + sw - 9},152 L${100 + ww},198 L${100 - ww},198 Z`
    : torsoPath(dims);
  return (
    <g>
      <path d={skirt} fill={c} />
      <path d={bodice} fill={c} />
      {strapped && (
        <path d={`M${100 - sw + 11},152 L${100 - sw + 13},140 M${100 + sw - 11},152 L${100 + sw - 13},140`} stroke={dark} strokeWidth="1.6" />
      )}
      {item.style === 'knit' && <path d="M90,139 Q100,146 110,139" stroke={dark} strokeWidth="3" fill="none" />}
      {item.style === 'floral' && (
        <g>
          <path d="M92,139 L100,150 L108,139 Z" fill={skin} />
          <PatternDots x={100 - hw - 6} y={204} w={hw * 2 + 12} h={32} color={item.accent} />
        </g>
      )}
      <path d={`M${100 - ww},196 Q100,200 ${100 + ww},196`} stroke={dark} strokeWidth="2.2" fill="none" />
      {long && <path d={`M${100 + 6},208 L${100 + 10},${hem}`} stroke={dark} strokeWidth="1" opacity=".5" />}
    </g>
  );
}

export function Shoes({ item, dims }) {
  const lx = footCenter(dims, -1);
  const rx = footCenter(dims, 1);
  if (!item) {
    return (
      <g fill="#00000022">
        <ellipse cx={lx} cy="270" rx="8" ry="4" />
        <ellipse cx={rx} cy="270" rx="8" ry="4" />
      </g>
    );
  }
  const c = item.color;
  const dark = shade(c, -0.3);
  const shoe = (x, side) => {
    switch (item.style) {
      case 'boots':
        return (
          <g key={side}>
            <rect x={x - 8} y="252" width="16" height="18" rx="4" fill={c} />
            <ellipse cx={x + side * 2} cy="270" rx="11" ry="5.5" fill={c} />
            <rect x={x - 8} y="268" width="20" height="3" rx="1.5" transform={side < 0 ? `translate(-4,0)` : undefined} fill={dark} />
          </g>
        );
      case 'heels':
        return (
          <g key={side}>
            <path d={`M${x - 9},268 Q${x},260 ${x + 9},268 L${x + 9},271 L${x - 9},271 Z`} fill={c} />
            <rect x={x - side * 7 - 1} y="270" width="2.5" height="6" fill={c} />
          </g>
        );
      case 'slippers':
        return (
          <g key={side}>
            <ellipse cx={x} cy="269" rx="12" ry="6.5" fill={c} />
            <ellipse cx={x - 4} cy="262" rx="2.5" ry="6" fill={c} />
            <ellipse cx={x + 4} cy="262" rx="2.5" ry="6" fill={c} />
            <ellipse cx={x - 4} cy="262" rx="1.2" ry="4" fill="#E8B4A0" />
            <ellipse cx={x + 4} cy="262" rx="1.2" ry="4" fill="#E8B4A0" />
            <circle cx={x - 3} cy="268" r=".9" fill="#2A1E1C" />
            <circle cx={x + 3} cy="268" r=".9" fill="#2A1E1C" />
          </g>
        );
      case 'sandals':
        return (
          <g key={side}>
            <ellipse cx={x} cy="271" rx="10" ry="3.5" fill={c} />
            <path d={`M${x - 7},268 L${x + 7},266`} stroke={dark} strokeWidth="2.2" strokeLinecap="round" />
          </g>
        );
      case 'loafers':
        return (
          <g key={side}>
            <ellipse cx={x + side * 1.5} cy="269" rx="11" ry="5.5" fill={c} />
            <path d={`M${x - 5},266 L${x + 5},266`} stroke={dark} strokeWidth="1.5" />
          </g>
        );
      default:
        return (
          <g key={side}>
            <ellipse cx={x + side * 1.5} cy="269" rx="11.5" ry="6" fill={c} />
            <rect x={x - 11 + side * 1.5} y="270" width="23" height="3" rx="1.5" fill={shade(c, -0.12)} />
            <path d={`M${x - 3},265 l4,0 M${x - 3},267.5 l4,0`} stroke={shade(c, -0.25)} strokeWidth="1" />
          </g>
        );
    }
  };
  return (
    <g>
      {shoe(lx, -1)}
      {shoe(rx, 1)}
    </g>
  );
}
