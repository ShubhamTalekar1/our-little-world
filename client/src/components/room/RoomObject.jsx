import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { FURNITURE_BY_ID } from '../../catalog/furniture';

function PaperLamp({ size }) {
  return (
    <svg viewBox="0 0 60 120" width={size * 0.55} height={size * 1.1} aria-hidden style={{ overflow: 'visible' }}>
      <circle cx="30" cy="30" r="60" fill="#F2C98B" opacity=".18" className="animate-flicker" />
      <rect x="28" y="40" width="4" height="72" fill="#3B2C2A" />
      <ellipse cx="30" cy="114" rx="14" ry="4" fill="#3B2C2A" />
      <ellipse cx="30" cy="30" rx="22" ry="20" fill="#FBE7C6" />
      <ellipse cx="30" cy="30" rx="22" ry="20" fill="none" stroke="#E8C79A" strokeWidth="1" />
      <path d="M10,26 Q30,22 50,26 M9,34 Q30,38 51,34" stroke="#E8C79A" strokeWidth="1" fill="none" />
    </svg>
  );
}

function FairyLights() {
  const bulbs = Array.from({ length: 18 }, (_, i) => i);
  return (
    <svg className="pointer-events-none absolute inset-x-0 top-0 h-[18%] w-full" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden>
      <path d="M0,8 Q250,70 500,20 Q750,-20 1000,40" stroke="#3B3448" strokeWidth="2" fill="none" />
      {bulbs.map((i) => {
        const t = i / 17;
        const x = t * 1000;
        const y = t < 0.5 ? 8 + Math.sin(t * 2 * Math.PI) * 38 + 12 : 20 + Math.sin((t - 0.5) * 2 * Math.PI) * -26 + 20 * t;
        const colors = ['#F2C98B', '#E8B4A0', '#B8A7D9', '#FFE2A8'];
        return (
          <g key={i}>
            <circle cx={x} cy={y + 6} r="12" fill={colors[i % 4]} opacity=".18" className="animate-twinkle" style={{ animationDelay: `${i * 0.27}s` }} />
            <circle cx={x} cy={y + 6} r="3.5" fill={colors[i % 4]} />
          </g>
        );
      })}
    </svg>
  );
}

/**
 * A decoration placed in the room. In decorate mode it can be dragged; the
 * parent converts the drop point back into percentages.
 */
export default function RoomObject({ item, scale = 1, decorating, containerRef, onMove, onRemove }) {
  const f = FURNITURE_BY_ID[item.id];
  if (!f) return null;
  if (f.id === 'fairy') return <FairyLights />;
  const size = f.size * scale;
  return (
    <motion.div
      drag={decorating}
      dragMomentum={false}
      dragConstraints={containerRef}
      dragElastic={0}
      onDragEnd={(e, info) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        onMove?.(item.uid, ((info.point.x - rect.left) / rect.width) * 100, ((info.point.y - rect.top) / rect.height) * 100);
      }}
      className={`absolute -translate-x-1/2 -translate-y-full select-none ${decorating ? 'z-30 cursor-grab rounded-xl outline-2 outline-dashed outline-cream/40 active:cursor-grabbing' : 'z-10'}`}
      style={{ left: `${item.x}%`, top: `${item.y}%`, touchAction: decorating ? 'none' : 'auto' }}
      whileHover={decorating ? { scale: 1.05 } : undefined}
      aria-label={f.name}
      title={f.name}
      role={decorating ? 'button' : 'img'}
      tabIndex={decorating ? 0 : -1}
      onKeyDown={(e) => {
        if (!decorating) return;
        const step = e.shiftKey ? 5 : 1.5;
        const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
        if (moves[e.key]) {
          e.preventDefault();
          onMove?.(item.uid, item.x + moves[e.key][0], item.y + moves[e.key][1]);
        }
        if (e.key === 'Delete' || e.key === 'Backspace') onRemove?.(item.uid);
      }}
    >
      {f.id === 'lamp' ? (
        <PaperLamp size={size} />
      ) : (
        <span className="block leading-none drop-shadow-[0_6px_8px_rgba(0,0,0,0.45)]" style={{ fontSize: size }}>
          {f.glow && <span className="absolute inset-0 -z-10 rounded-full bg-lamp/30 blur-xl animate-flicker" />}
          {f.emoji}
        </span>
      )}
      {decorating && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.(item.uid);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -right-3 -top-3 grid h-6 w-6 place-items-center rounded-full bg-ink/90 text-cream ring-1 ring-line-strong"
          aria-label={`Remove ${f.name}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </motion.div>
  );
}
