import { AnimatePresence, motion } from 'framer-motion';
import { useUiStore } from '../../stores/uiStore';
import { GIFTS_BY_ID } from '../../catalog/gifts';
import { usePartnerWords } from '../../lib/words';

/** Full-screen flourish after sending: the gift floats up and away to them. */
export default function GiftSendAnimation() {
  const sending = useUiStore((s) => s.sendingGift);
  const setSending = useUiStore((s) => s.setSendingGift);
  const w = usePartnerWords();
  const gift = sending ? GIFTS_BY_ID[sending.giftId] : null;
  return (
    <AnimatePresence>
      {gift && (
        <motion.div
          key={sending.key}
          className="fixed inset-0 z-[60] grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSending(null)}
        >
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-[3px]" />
          <div className="relative flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.3, y: 60, opacity: 0 }}
              animate={{ scale: [0.3, 1.25, 1, 0.5], y: [60, 0, -10, -420], opacity: [0, 1, 1, 0], rotate: [0, -6, 6, 0] }}
              transition={{ duration: 2.4, times: [0, 0.3, 0.6, 1], ease: 'easeInOut' }}
              className="text-8xl"
              aria-hidden
            >
              {gift.emoji}
            </motion.div>
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute text-lg"
                initial={{ opacity: 0, x: 0, y: 0 }}
                animate={{ opacity: [0, 1, 0], x: Math.cos((i / 10) * Math.PI * 2) * 140, y: Math.sin((i / 10) * Math.PI * 2) * 140 - 40 }}
                transition={{ duration: 1.3, delay: 0.5 }}
                aria-hidden
              >
                ✨
              </motion.span>
            ))}
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mt-4 font-display text-3xl text-cream" role="status">
              {gift.name.replace(/^(A |The )/, '')} sent ❤️
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-1 text-sm text-muted">
              It’s on its way to {w.them}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
