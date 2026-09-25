import { motion } from 'framer-motion';
import { useMemo } from 'react';

const GLYPHS = {
  hearts: ['❤️', '🤍', '💗'],
  kiss: ['💋', '❤️', '💗'],
  stream: ['❤️', '💕', '💗', '🤍'],
  sparkle: ['✨', '⭐', '✨'],
  dance: ['🤍', '✨', '💫'],
};

/**
 * Floating emoji particles. `from`/`to` are percentages within the parent;
 * with `to`, particles travel between the two avatars.
 */
export default function Particles({ type = 'hearts', from = { x: 50, y: 55 }, to, count = 12, runKey }) {
  const parts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        glyph: GLYPHS[type]?.[i % (GLYPHS[type]?.length ?? 1)] ?? '❤️',
        dx: (Math.random() - 0.5) * 18,
        dy: 12 + Math.random() * 22,
        delay: i * (to ? 0.09 : 0.07),
        size: 14 + Math.random() * 14,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [type, count, runKey],
  );
  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden" aria-hidden>
      {parts.map((p, i) => (
        <motion.span
          key={`${runKey}-${i}`}
          className="absolute"
          style={{ left: `${from.x}%`, top: `${from.y}%`, fontSize: p.size }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
          animate={
            to
              ? {
                  opacity: [0, 1, 1, 0],
                  left: [`${from.x}%`, `${(from.x + to.x) / 2}%`, `${to.x}%`],
                  top: [`${from.y + p.dx / 4}%`, `${Math.min(from.y, to.y) - 14 - p.dy / 3}%`, `${to.y}%`],
                  scale: [0.4, 1, 0.8],
                }
              : { opacity: [0, 1, 0], x: [0, p.dx * 3], y: [0, -p.dy * 6], scale: [0.4, 1.1, 0.9] }
          }
          transition={{ duration: to ? 1.6 : 2.2, delay: p.delay, ease: 'easeOut' }}
        >
          {p.glyph}
        </motion.span>
      ))}
    </div>
  );
}
