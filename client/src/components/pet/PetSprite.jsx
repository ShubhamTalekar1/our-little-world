import { motion } from 'framer-motion';

const LOOKS = {
  cat: { body: '#E9D9C4', accent: '#C9A988', ear: 'pointy', tail: 'long', snout: false },
  dog: { body: '#C89A6A', accent: '#8E6440', ear: 'floppy', tail: 'short', snout: true },
  bunny: { body: '#F2ECEA', accent: '#E8B4A0', ear: 'long', tail: 'puff', snout: false },
  fox: { body: '#D97A48', accent: '#F5EBDD', ear: 'pointy', tail: 'fluffy', snout: true },
  dragon: { body: '#9DB8A0', accent: '#B8A7D9', ear: 'horns', tail: 'spiky', snout: false, wings: true },
};

function Ears({ type, c, a }) {
  switch (type) {
    case 'floppy':
      return (
        <g fill={a}>
          <ellipse cx="36" cy="40" rx="9" ry="16" transform="rotate(20 36 40)" />
          <ellipse cx="84" cy="40" rx="9" ry="16" transform="rotate(-20 84 40)" />
        </g>
      );
    case 'long':
      return (
        <g>
          <ellipse cx="48" cy="12" rx="8" ry="24" fill={c} transform="rotate(-8 48 12)" />
          <ellipse cx="72" cy="12" rx="8" ry="24" fill={c} transform="rotate(8 72 12)" />
          <ellipse cx="48" cy="14" rx="4" ry="16" fill={a} transform="rotate(-8 48 14)" />
          <ellipse cx="72" cy="14" rx="4" ry="16" fill={a} transform="rotate(8 72 14)" />
        </g>
      );
    case 'horns':
      return (
        <g fill={a}>
          <path d="M44,30 L40,10 L52,26 Z" />
          <path d="M76,30 L80,10 L68,26 Z" />
        </g>
      );
    default:
      return (
        <g>
          <path d="M34,38 L38,12 L56,28 Z" fill={c} />
          <path d="M86,38 L82,12 L64,28 Z" fill={c} />
          <path d="M39,32 L41,19 L50,28 Z" fill={a} />
          <path d="M81,32 L79,19 L70,28 Z" fill={a} />
        </g>
      );
  }
}

function Tail({ type, c, a }) {
  switch (type) {
    case 'short':
      return <path d="M100,86 q14,-10 12,-22" stroke={c} strokeWidth="8" strokeLinecap="round" fill="none" />;
    case 'puff':
      return <circle cx="104" cy="92" r="9" fill="#fff" />;
    case 'fluffy':
      return (
        <g>
          <path d="M96,92 C128,96 134,60 116,50 C122,70 110,84 96,86 Z" fill={c} />
          <path d="M116,50 C124,56 124,64 120,68 C118,60 116,56 116,50 Z" fill={a} />
        </g>
      );
    case 'spiky':
      return <path d="M98,92 C120,94 128,78 124,64 L130,62 L122,58 C118,74 110,84 98,86 Z" fill={c} />;
    default:
      return <path d="M98,90 C122,92 124,66 112,58" stroke={c} strokeWidth="7" strokeLinecap="round" fill="none" />;
  }
}

function Accessory({ id }) {
  switch (id) {
    case 'bow':
      return (
        <g transform="translate(74,30)">
          <path d="M0,0 L-10,-7 L-10,7 Z M0,0 L10,-7 L10,7 Z" fill="#D98E96" />
          <circle r="3" fill="#C4707A" />
        </g>
      );
    case 'scarf':
      return <path d="M36,66 Q60,76 84,66 L84,74 Q60,84 36,74 Z M70,72 L74,92 L82,90 L78,72 Z" fill="#B8664A" />;
    case 'crown':
      return <path d="M46,24 L50,10 L56,20 L60,6 L64,20 L70,10 L74,24 Z" fill="#F2C98B" stroke="#D4A55B" strokeWidth="1.5" />;
    case 'flower':
      return (
        <g transform="translate(46,30)">
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 4} cy={Math.sin((a * Math.PI) / 180) * 4} r="3.6" fill="#F5EBDD" />
          ))}
          <circle r="2.4" fill="#F2C98B" />
        </g>
      );
    default:
      return null;
  }
}

/** Tiny companion. `mood` changes the face; `bounce` plays a happy hop. */
export default function PetSprite({ species = 'cat', accessory, size = 90, mood = 'happy', bounceKey, label }) {
  const L = LOOKS[species] ?? LOOKS.cat;
  const sleepy = mood === 'sleepy';
  return (
    <motion.svg
      key={bounceKey}
      viewBox="0 0 140 120"
      width={size}
      height={(size * 120) / 140}
      role="img"
      aria-label={label ?? species}
      initial={bounceKey ? { y: 0 } : false}
      animate={bounceKey ? { y: [0, -18, 0, -8, 0] } : undefined}
      transition={{ duration: 0.8 }}
      style={{ overflow: 'visible' }}
    >
      <ellipse cx="66" cy="112" rx="40" ry="6" fill="#000" opacity=".25" />
      <Tail type={L.tail} c={L.body} a={L.accent} />
      {L.wings && <path d="M80,70 C100,40 124,50 118,70 C110,64 100,68 92,80 Z" fill={L.accent} opacity=".9" />}
      <ellipse cx="66" cy="88" rx="36" ry="24" fill={L.body} />
      <ellipse cx="66" cy="94" rx="20" ry="13" fill={L.accent} opacity=".45" />
      <g className="sway" style={{ animationDuration: '5s' }}>
        <Ears type={L.ear} c={L.body} a={L.accent} />
        <circle cx="60" cy="50" r="28" fill={L.body} />
        {L.snout && <ellipse cx="60" cy="60" rx="13" ry="9" fill={L.accent} opacity=".8" />}
        {sleepy ? (
          <g stroke="#2A1E1C" strokeWidth="2.2" strokeLinecap="round" fill="none">
            <path d="M46,50 q4,3 8,0" />
            <path d="M66,50 q4,3 8,0" />
          </g>
        ) : (
          <g fill="#2A1E1C" className="avatar-eyes">
            <ellipse cx="50" cy="49" rx="3.6" ry="4.4" />
            <ellipse cx="70" cy="49" rx="3.6" ry="4.4" />
            <circle cx="51.2" cy="47.4" r="1.3" fill="#fff" />
            <circle cx="71.2" cy="47.4" r="1.3" fill="#fff" />
          </g>
        )}
        <path d="M57,57 q3,3 6,0" stroke="#2A1E1C" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <ellipse cx="58.5" cy="55" rx="2.2" ry="1.5" fill="#C4707A" />
        <g fill="#E88C8C" opacity=".35">
          <ellipse cx="42" cy="57" rx="5" ry="3" />
          <ellipse cx="78" cy="57" rx="5" ry="3" />
        </g>
        <Accessory id={accessory} />
      </g>
      <g fill={L.body}>
        <ellipse cx="46" cy="108" rx="9" ry="6" />
        <ellipse cx="82" cy="108" rx="9" ry="6" />
      </g>
    </motion.svg>
  );
}
