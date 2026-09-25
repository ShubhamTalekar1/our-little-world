import { AnimatePresence, motion } from 'framer-motion';
import { useUiStore } from '../../stores/uiStore';

export default function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);
  const openGift = useUiStore((s) => s.setOpeningGift);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[4.75rem] z-[70] flex flex-col items-center gap-2 px-4 sm:top-[5.25rem]" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="glass pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl py-2.5 pl-3.5 pr-2.5 shadow-soft"
          >
            {t.emoji && <span className="text-lg" aria-hidden>{t.emoji}</span>}
            <p className={`text-sm ${t.tone === 'error' ? 'text-rose' : 'text-cream'}`}>{t.message}</p>
            {t.action ? (
              <button
                onClick={() => {
                  if (t.action.giftId) openGift(t.action.giftId);
                  t.action.onClick?.();
                  dismiss(t.id);
                }}
                className="ml-1 rounded-xl bg-peach px-3 py-1.5 text-xs font-semibold text-ink hover:brightness-105"
              >
                {t.action.label}
              </button>
            ) : (
              <button onClick={() => dismiss(t.id)} className="ml-1 rounded-lg px-1.5 text-muted hover:text-cream" aria-label="Dismiss">
                ×
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
