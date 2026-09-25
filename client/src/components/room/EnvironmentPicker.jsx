import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { ENVIRONMENTS, ENV_BY_ID } from '../../catalog/environments';
import { useRoomStore } from '../../stores/roomStore';
import { toast } from '../../stores/uiStore';

export default function EnvironmentPicker({ className = '' }) {
  const env = useRoomStore((s) => s.environment);
  const setEnv = useRoomStore((s) => s.setEnvironment);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const key = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', key);
    };
  }, [open]);
  const cur = ENV_BY_ID[env];
  return (
    <div ref={ref} className={`relative ${className}`}>
      <button onClick={() => setOpen((v) => !v)} aria-haspopup="listbox" aria-expanded={open} className="glass flex items-center gap-2 rounded-full py-1.5 pl-3 pr-2.5 text-[13px] text-cream">
        <span aria-hidden>{cur?.emoji}</span>
        {cur?.short}
        <ChevronDown className={`h-3.5 w-3.5 text-muted transition ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label="Where are we?"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            className="glass absolute left-0 top-full z-40 mt-2 w-64 rounded-2xl p-1.5 shadow-soft"
          >
            {ENVIRONMENTS.map((e) => (
              <li key={e.id}>
                <button
                  role="option"
                  aria-selected={e.id === env}
                  onClick={() => {
                    setEnv(e.id);
                    setOpen(false);
                    toast(`Moved you both ${e.presence}`, { emoji: e.emoji });
                  }}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-surface-3 ${e.id === env ? 'bg-surface-3/70' : ''}`}
                >
                  <span className="text-lg" aria-hidden>{e.emoji}</span>
                  <span>
                    <span className="block text-sm text-cream">{e.name}</span>
                    <span className="block text-[11.5px] text-muted">{e.mood}</span>
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
