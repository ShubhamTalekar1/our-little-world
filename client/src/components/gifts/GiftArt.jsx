import { motion, useReducedMotion } from 'framer-motion';
import { RARITY } from '../../catalog/gifts';

const IDLE = {
  bloom: { animate: { rotate: [-4, 4, -4], scale: [1, 1.04, 1] }, transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' } },
  float: { animate: { y: [0, -8, 0] }, transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } },
  pulse: { animate: { scale: [1, 1.12, 1, 1.08, 1] }, transition: { duration: 1.6, repeat: Infinity, repeatDelay: 0.6 } },
  bounce: { animate: { y: [0, -6, 0], scaleY: [1, 1.04, 1] }, transition: { duration: 1.8, repeat: Infinity } },
  steam: { animate: { rotate: [-2, 2, -2] }, transition: { duration: 3, repeat: Infinity } },
  flicker: { animate: { opacity: [1, 0.85, 1, 0.92, 1], scale: [1, 1.02, 1] }, transition: { duration: 2.4, repeat: Infinity } },
  sparkle: { animate: { rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] }, transition: { duration: 3.4, repeat: Infinity } },
  glow: { animate: { filter: ['drop-shadow(0 0 6px #F5EBDD66)', 'drop-shadow(0 0 18px #F5EBDDaa)', 'drop-shadow(0 0 6px #F5EBDD66)'] }, transition: { duration: 3, repeat: Infinity } },
  shake: { animate: { rotate: [0, -6, 6, -4, 4, 0] }, transition: { duration: 0.9, repeat: Infinity, repeatDelay: 2 } },
};

/** The gift itself: emoji on a soft orb, with its own idle motion. */
export default function GiftArt({ gift, size = 88, still = false }) {
  const reduce = useReducedMotion();
  const anim = !still && !reduce ? IDLE[gift.anim] : null;
  const rarity = RARITY[gift.rarity];
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full blur-xl" style={{ background: `radial-gradient(circle, ${gift.hue}55, transparent 70%)` }} aria-hidden />
      <div
        className="absolute inset-[8%] rounded-full"
        style={{ background: `radial-gradient(circle at 35% 30%, ${gift.hue}40, ${gift.hue}10 60%, transparent)`, boxShadow: gift.rarity !== 'common' ? `inset 0 0 0 1px ${rarity.color}55` : undefined }}
        aria-hidden
      />
      <motion.span className="relative select-none leading-none" style={{ fontSize: size * 0.5 }} animate={anim?.animate} transition={anim?.transition} aria-hidden>
        {gift.emoji}
      </motion.span>
      {gift.anim === 'steam' && !still && (
        <span className="absolute left-1/2 top-[8%] -translate-x-1/2 text-[10px] text-cream/40 animate-float-slow" aria-hidden>
          ∿∿
        </span>
      )}
    </div>
  );
}
