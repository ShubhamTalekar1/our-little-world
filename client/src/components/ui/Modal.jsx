import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

/** Accessible modal: focus is moved in, Escape closes, focus is trapped & restored. */
export default function Modal({ open, onClose, title, children, className, hideClose, labelledBy, dim = 'bg-ink/70' }) {
  const panel = useRef(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const t = setTimeout(() => {
      const el = panel.current?.querySelector('[data-autofocus]') ?? panel.current?.querySelector('button, [href], input, textarea, select');
      el?.focus();
    }, 50);
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll('button:not([disabled]), [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className={cn('absolute inset-0 backdrop-blur-sm', dim)} onClick={onClose} aria-hidden />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={labelledBy ? undefined : title}
            aria-labelledby={labelledBy}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className={cn('glass relative max-h-[92dvh] w-full overflow-y-auto rounded-t-4xl p-6 shadow-soft sm:max-w-lg sm:rounded-4xl', className)}
          >
            {!hideClose && (
              <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-muted transition hover:bg-surface-3 hover:text-cream" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            )}
            {title && <h2 className="mb-4 pr-8 text-xl text-cream">{title}</h2>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
