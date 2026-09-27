import { useState } from 'react';
import { Star } from 'lucide-react';
import { kindInfo } from '../lib/classify.js';

export function KindBadge({ kind, className = '' }) {
  const k = kindInfo(kind);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}
      style={{ background: `${k.color}22`, color: k.color }}
    >
      <span aria-hidden>{k.emoji}</span>
      {k.label.replace(/s$/, '')}
    </span>
  );
}

export function Stars({ value = 0, onChange, size = 20 }) {
  return (
    <div className="flex gap-0.5" role={onChange ? 'radiogroup' : undefined} aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n === value ? 0 : n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className="p-0.5 disabled:cursor-default"
        >
          <Star size={size} className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-ink-3/50'} />
        </button>
      ))}
    </div>
  );
}

/** Image with an emoji fallback for broken or missing previews. */
export function Cover({ item, className = '' }) {
  const k = kindInfo(item.kind);
  const [failed, setFailed] = useState(null);
  if (item.image && failed !== item.image) {
    return (
      <img
        src={item.image}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        className={`object-cover ${className}`}
        onError={() => setFailed(item.image)}
      />
    );
  }
  return (
    <div className={`grid place-items-center text-3xl ${className}`} style={{ background: `${k.color}1f` }}>
      <span aria-hidden>{k.emoji}</span>
    </div>
  );
}

export function PageHeader({ title, subtitle, left, right }) {
  return (
    <header className="safe-top sticky top-0 z-[500] bg-paper/90 px-4 pb-3 pt-4 backdrop-blur-lg">
      <div className="flex items-center gap-2">
        {left}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[32px] leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-ink-3">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}

export function Empty({ emoji, title, children }) {
  return (
    <div className="mx-4 mt-6 rounded-3xl border border-dashed border-line-2 px-6 py-12 text-center">
      <div className="text-4xl">{emoji}</div>
      <p className="mt-3 font-display text-2xl">{title}</p>
      <div className="mx-auto mt-1 max-w-xs text-sm text-ink-2">{children}</div>
    </div>
  );
}

export const btn =
  'inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition active:scale-[0.97] disabled:opacity-50';
export const btnPrimary = `${btn} bg-accent text-accent-ink`;
export const btnGhost = `${btn} bg-sunk text-ink`;
export const input =
  'w-full rounded-2xl border border-line bg-card px-4 py-3 text-[15px] text-ink placeholder:text-ink-3 outline-none focus:border-accent';
