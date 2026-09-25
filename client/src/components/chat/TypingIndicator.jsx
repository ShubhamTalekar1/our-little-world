import { motion } from 'framer-motion';

export default function TypingIndicator({ name }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2" role="status" aria-label={`${name} is typing`}>
      <span className="flex gap-1 rounded-3xl rounded-bl-lg bg-surface-2 px-4 py-3.5 ring-1 ring-line">
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-cream-dim" animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
        ))}
      </span>
    </motion.div>
  );
}
