import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { NAV, NAV_LOCKED, MOBILE_PRIMARY } from './nav';
import { useUiStore } from '../../stores/uiStore';

export default function MoreSheet() {
  const open = useUiStore((s) => s.mobileMoreOpen);
  const setOpen = useUiStore((s) => s.setMobileMoreOpen);
  const items = NAV.filter((n) => !MOBILE_PRIMARY.includes(n.to));
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <motion.div
            role="dialog"
            aria-label="More places"
            className="glass safe-bottom absolute inset-x-0 bottom-0 rounded-t-4xl p-5 pb-8"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(e, info) => info.offset.y > 80 && setOpen(false)}
          >
            <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-line-strong" />
            <div className="grid grid-cols-4 gap-2">
              {items.map(({ to, label, icon: Icon }, i) => (
                <motion.div key={to} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Link to={to} onClick={() => setOpen(false)} className="flex flex-col items-center gap-2 rounded-2xl p-3 text-center text-[12px] text-cream-dim hover:bg-surface-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 ring-1 ring-line">
                      <Icon className="h-5 w-5 text-peach" aria-hidden />
                    </span>
                    {label}
                  </Link>
                </motion.div>
              ))}
            </div>
            {NAV_LOCKED.length > 0 && (
              <>
                <p className="eyebrow mb-2 mt-6 px-1">Coming later</p>
                <div className="grid grid-cols-4 gap-2">
                  {NAV_LOCKED.map(({ to, label, icon: Icon }) => (
                    <div key={to} className="flex flex-col items-center gap-2 p-3 text-center text-[12px] text-faint" aria-disabled="true">
                      <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-surface-2/50 ring-1 ring-line">
                        <Icon className="h-5 w-5" aria-hidden />
                        <Lock className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-ink p-0.5" aria-label="locked" />
                      </span>
                      {label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
