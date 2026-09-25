import { motion } from 'framer-motion';
import MemoryPhoto from './MemoryPhoto';
import { formatDate } from '../../lib/time';

/** A polaroid, slightly crooked, held up with a bit of tape. */
export default function MemoryCard({ memory, onOpen, index = 0, size = 'md' }) {
  const reactions = Object.values(memory.reactions ?? {});
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 20, rotate: memory.rotation * 2 }}
      animate={{ opacity: 1, y: 0, rotate: memory.rotation }}
      whileHover={{ rotate: 0, y: -6, scale: 1.03, zIndex: 10 }}
      whileFocus={{ rotate: 0, scale: 1.03, zIndex: 10 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: Math.min(index, 12) * 0.04 }}
      onClick={() => onOpen?.(memory)}
      className="group relative block w-full bg-[#f8f1e6] p-2.5 pb-3 text-left shadow-[0_14px_30px_-12px_rgba(0,0,0,0.7)]"
      aria-label={`${memory.caption}, ${formatDate(memory.date)}`}
    >
      <span className="absolute -top-2.5 left-1/2 h-5 w-14 -translate-x-1/2 rotate-[-3deg] bg-[#e9dcc6]/70 shadow-sm" aria-hidden />
      <div className={size === 'sm' ? 'aspect-square overflow-hidden' : 'aspect-[4/5] overflow-hidden'}>
        <MemoryPhoto memory={memory} className="transition duration-500 group-hover:scale-105" />
      </div>
      <p className="hand mt-2 line-clamp-2 text-[19px] leading-[1.1] text-[#3b3128]">{memory.caption}</p>
      <p className="mt-1 flex items-center justify-between text-[10.5px] uppercase tracking-wider text-[#8a7d6d]">
        {formatDate(memory.date, { month: 'short', day: 'numeric' })}
        {reactions.length > 0 && <span className="text-sm normal-case">{reactions.join('')}</span>}
      </p>
    </motion.button>
  );
}
