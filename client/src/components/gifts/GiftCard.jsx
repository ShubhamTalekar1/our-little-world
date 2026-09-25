import { motion } from 'framer-motion';
import GiftArt from './GiftArt';
import { RARITY } from '../../catalog/gifts';

export default function GiftCard({ gift, onSelect, index = 0 }) {
  const rarity = RARITY[gift.rarity];
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.035 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(gift)}
      className="group card flex flex-col items-center gap-2 p-4 text-center transition hover:border-line-strong hover:bg-surface-2/80"
      aria-label={`${gift.name}, ${rarity.label}`}
    >
      <GiftArt gift={gift} size={84} />
      <div className="mt-1">
        <p className="text-sm font-medium text-cream">{gift.name}</p>
        <p className="mt-0.5 line-clamp-2 min-h-[2.5em] text-[11.5px] leading-snug text-muted">{gift.description}</p>
      </div>
      <div className="mt-auto pt-1 text-xs">
        <span style={{ color: rarity.color }}>{rarity.label}</span>
      </div>
    </motion.button>
  );
}
