import { motion } from 'framer-motion';
import { X, Pin } from 'lucide-react';
import { useClock } from '../room/effects';
import { countdownParts } from '../../lib/time';
import { cn } from '../../lib/cn';

const ACCENTS = {
  peach: 'from-peach/25 via-peach/5 ring-peach/20',
  lavender: 'from-lavender/25 via-lavender/5 ring-lavender/20',
  lamp: 'from-lamp/25 via-lamp/5 ring-lamp/20',
  sage: 'from-sage/25 via-sage/5 ring-sage/20',
};

function Unit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <motion.span key={value} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display text-2xl tabular-nums text-cream sm:text-3xl">
        {String(value).padStart(2, '0')}
      </motion.span>
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted">{label}</span>
    </div>
  );
}

export default function Countdown({ countdown, onRemove, onTogglePin, compact }) {
  const now = useClock(compact ? 30_000 : 1000);
  const p = countdownParts(countdown.target, now);
  return (
    <div className={cn('relative overflow-hidden rounded-3xl bg-gradient-to-br to-transparent p-5 ring-1', ACCENTS[countdown.accent] ?? ACCENTS.peach)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-cream-dim">
          <span className="mr-1.5" aria-hidden>{countdown.emoji}</span>
          {countdown.title}
        </p>
        <div className="flex gap-1">
          {onTogglePin && (
            <button onClick={onTogglePin} className={cn('rounded-lg p-1 hover:bg-surface-3', countdown.pinned ? 'text-peach' : 'text-faint')} aria-label={countdown.pinned ? 'Unpin from home' : 'Pin to home'}>
              <Pin className="h-3.5 w-3.5" />
            </button>
          )}
          {onRemove && (
            <button onClick={onRemove} className="rounded-lg p-1 text-faint hover:bg-surface-3 hover:text-cream" aria-label={`Remove ${countdown.title}`}>
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      {p.done ? (
        <p className="hand mt-3 text-3xl text-peach">It’s here ❤️</p>
      ) : compact ? (
        <p className="mt-2 font-display text-xl text-cream">
          {p.days > 0 && <>{p.days} days </>}
          {p.hours} hours {p.days === 0 && <>{p.minutes} minutes</>}
        </p>
      ) : (
        <div className="mt-4 flex justify-between" aria-label={`${p.days} days, ${p.hours} hours, ${p.minutes} minutes`}>
          <Unit value={p.days} label="days" />
          <Unit value={p.hours} label="hours" />
          <Unit value={p.minutes} label="min" />
          <Unit value={p.seconds} label="sec" />
        </div>
      )}
    </div>
  );
}
