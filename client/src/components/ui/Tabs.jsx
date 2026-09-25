import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

/** Pill tabs with a sliding indicator. Arrow keys move between tabs. */
export default function Tabs({ tabs, value, onChange, className, layoutId = 'tabs' }) {
  const onKey = (e) => {
    const i = tabs.findIndex((t) => t.id === value);
    if (e.key === 'ArrowRight') onChange(tabs[(i + 1) % tabs.length].id);
    if (e.key === 'ArrowLeft') onChange(tabs[(i - 1 + tabs.length) % tabs.length].id);
  };
  return (
    <div role="tablist" onKeyDown={onKey} className={cn('no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-line bg-surface/70 p-1', className)}>
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={cn('relative shrink-0 rounded-xl px-3.5 py-2 text-[13px] font-medium transition', active ? 'text-ink' : 'text-muted hover:text-cream')}
          >
            {active && <motion.span layoutId={layoutId} className="absolute inset-0 rounded-xl bg-cream" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
            <span className="relative flex items-center gap-1.5">
              {t.emoji && <span aria-hidden>{t.emoji}</span>}
              {t.label}
              {t.count != null && <span className={cn('text-[11px]', active ? 'text-ink/60' : 'text-faint')}>{t.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
