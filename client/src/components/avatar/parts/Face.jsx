import { shade } from '../../../lib/color';
import { EYES } from '../geometry';

const INK = '#2A1E1C';

function Eye({ x, style, color }) {
  const y = EYES.y;
  switch (style) {
    case 'happy':
      return <path d={`M${x - 6},${y + 1} Q${x},${y - 7} ${x + 6},${y + 1}`} stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none" />;
    case 'sleepy':
      return (
        <g>
          <path d={`M${x - 6},${y - 1} Q${x},${y + 4} ${x + 6},${y - 1}`} stroke={INK} strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d={`M${x - 6},${y - 1} l-2,-2 M${x + 6},${y - 1} l2,-2`} stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
        </g>
      );
    case 'sparkle':
      return (
        <g>
          <ellipse cx={x} cy={y} rx="6.4" ry="7.6" fill={INK} />
          <ellipse cx={x} cy={y + 1.2} rx="4.8" ry="5.6" fill={color} />
          <ellipse cx={x} cy={y + 1.6} rx="2.6" ry="3" fill={INK} />
          <circle cx={x + 2.2} cy={y - 2.8} r="2.2" fill="#fff" />
          <circle cx={x - 2.4} cy={y + 3} r="1.1" fill="#fff" opacity=".85" />
        </g>
      );
    case 'lashes':
      return (
        <g>
          <ellipse cx={x} cy={y} rx="5" ry="6" fill={shade(color, -0.35)} />
          <circle cx={x + 1.8} cy={y - 2} r="1.8" fill="#fff" />
          <path
            d={x < 100 ? `M${x - 5},${y - 4} l-3.5,-2.5 M${x - 3},${y - 6} l-2,-3` : `M${x + 5},${y - 4} l3.5,-2.5 M${x + 3},${y - 6} l2,-3`}
            stroke={INK}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      );
    default:
      return (
        <g>
          <ellipse cx={x} cy={y} rx="5" ry="6" fill={shade(color, -0.35)} />
          <circle cx={x + 1.8} cy={y - 2} r="1.8" fill="#fff" />
        </g>
      );
  }
}

function Brows({ style, color }) {
  const c = shade(color, -0.15);
  const common = { stroke: c, strokeLinecap: 'round', fill: 'none' };
  switch (style) {
    case 'arched':
      return (
        <g {...common} strokeWidth="2.2">
          <path d="M75,81 Q82,73 89,79" />
          <path d="M111,79 Q118,73 125,81" />
        </g>
      );
    case 'straight':
      return (
        <g {...common} strokeWidth="2.4">
          <path d="M76,79 L89,78" />
          <path d="M111,78 L124,79" />
        </g>
      );
    case 'thick':
      return (
        <g {...common} strokeWidth="3.6">
          <path d="M76,80 Q82,76 89,78" />
          <path d="M111,78 Q118,76 124,80" />
        </g>
      );
    default:
      return (
        <g {...common} strokeWidth="2.2">
          <path d="M76,80 Q82,76 88,78" />
          <path d="M112,78 Q118,76 124,80" />
        </g>
      );
  }
}

function Nose({ style, skin }) {
  const c = shade(skin, -0.22);
  switch (style) {
    case 'dot':
      return <ellipse cx="100" cy="104" rx="2" ry="1.5" fill={c} />;
    case 'line':
      return <path d="M101,97 L98.5,105 L102,105" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />;
    default:
      return <path d="M97,104 Q100,107 103,104" stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none" />;
  }
}

function Mouth({ style }) {
  const lip = '#9B4B4B';
  switch (style) {
    case 'grin':
      return (
        <g>
          <path d="M91,111 Q100,123 109,111 Z" fill="#6E2F35" />
          <path d="M92.5,111.5 L107.5,111.5 L106,114 L94,114 Z" fill="#fff" />
        </g>
      );
    case 'cat':
      return <path d="M92,112 Q96,117 100,112 Q104,117 108,112" stroke={lip} strokeWidth="2" strokeLinecap="round" fill="none" />;
    case 'smirk':
      return <path d="M93,114 Q102,118 108,110" stroke={lip} strokeWidth="2.2" strokeLinecap="round" fill="none" />;
    case 'o':
      return <ellipse cx="100" cy="114" rx="3.2" ry="4" fill="#6E2F35" />;
    case 'kiss':
      return (
        <path d="M98,109 Q104,110.5 99.5,113.5 Q104,116 98,118" stroke={lip} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      );
    default:
      return <path d="M92,112 Q100,120 108,112" stroke={lip} strokeWidth="2.2" strokeLinecap="round" fill="none" />;
  }
}

function Extras({ style, skin }) {
  const blush = (
    <g fill="#E88C8C" opacity=".32">
      <ellipse cx="73" cy="106" rx="8" ry="5" />
      <ellipse cx="127" cy="106" rx="8" ry="5" />
    </g>
  );
  const freckles = (
    <g fill={shade(skin, -0.35)} opacity=".55">
      {[[74, 102], [79, 105], [72, 107], [126, 102], [121, 105], [128, 107]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="1" />
      ))}
    </g>
  );
  switch (style) {
    case 'freckles':
      return freckles;
    case 'blush-freckles':
      return (
        <g>
          {blush}
          {freckles}
        </g>
      );
    case 'mole':
      return (
        <g>
          {blush}
          <circle cx="112" cy="115" r="1.3" fill={shade(skin, -0.5)} />
        </g>
      );
    case 'none':
      return null;
    default:
      return blush;
  }
}

/** Expression overrides let interactions (kiss, laugh…) temporarily change the face. */
export default function Face({ face, skin, hairColor, expression }) {
  const eyeStyle = expression === 'happy' || expression === 'kiss' || expression === 'love' ? 'happy' : face.eyes;
  const mouthStyle = expression === 'kiss' ? 'kiss' : expression === 'happy' || expression === 'love' ? 'grin' : expression === 'surprised' ? 'o' : face.mouth;
  const blinks = eyeStyle !== 'happy' && eyeStyle !== 'sleepy';
  return (
    <g>
      <Extras style={expression === 'love' ? 'blush' : face.extra} skin={skin} />
      {expression === 'love' && (
        <g fill="#E88C8C" opacity=".5">
          <ellipse cx="73" cy="106" rx="9" ry="5.5" />
          <ellipse cx="127" cy="106" rx="9" ry="5.5" />
        </g>
      )}
      <Brows style={face.brows} color={hairColor} />
      <g className={blinks ? 'avatar-eyes' : undefined}>
        <Eye x={EYES.lx} style={eyeStyle} color={face.eyeColor} />
        <Eye x={EYES.rx} style={eyeStyle} color={face.eyeColor} />
      </g>
      <Nose style={face.nose} skin={skin} />
      <Mouth style={mouthStyle} />
    </g>
  );
}
