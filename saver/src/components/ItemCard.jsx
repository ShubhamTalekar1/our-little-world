import { Link } from 'react-router-dom';
import { Check, Loader2, MapPin } from 'lucide-react';
import { Cover, KindBadge } from './ui.jsx';
import { hostOf } from '../lib/links.js';

export default function ItemCard({ item }) {
  const done = item.status === 'done';
  return (
    <Link
      to={`/item/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition active:scale-[0.98]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {item.fetchState === 'pending' && !item.image ? (
          <div className="skeleton h-full w-full" />
        ) : (
          <Cover item={item} className={`h-full w-full ${done ? 'opacity-60' : ''}`} />
        )}
        {done && (
          <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-good text-white shadow">
            <Check size={16} strokeWidth={3} />
          </span>
        )}
        {item.fetchState === 'pending' && (
          <span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-card/90 text-ink-2">
            <Loader2 size={15} className="animate-spin" />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className={`line-clamp-2 text-[14px] font-medium leading-snug ${done ? 'text-ink-2' : ''}`}>
          {item.title || (item.url ? hostOf(item.url) : 'Untitled')}
        </p>
        <div className="mt-auto flex items-center gap-1.5 text-[11px] text-ink-3">
          <KindBadge kind={item.kind} />
          {item.place?.lat != null && <MapPin size={12} />}
          <span className="truncate">{item.siteName || (item.title && item.url ? hostOf(item.url) : '')}</span>
        </div>
      </div>
    </Link>
  );
}

export function ItemGrid({ items }) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3">
      {items.map((i) => (
        <ItemCard key={i.id} item={i} />
      ))}
    </div>
  );
}
