import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSaves } from '../stores/useSaves.js';
import PlaceMap from '../components/PlaceMap.jsx';
import { Empty, PageHeader } from '../components/ui.jsx';

export default function MapPage() {
  const items = useSaves((s) => s.items);
  const [filter, setFilter] = useState('todo');
  const places = useMemo(() => items.filter((i) => i.place?.lat != null), [items]);
  const shown = filter === 'all' ? places : places.filter((i) => i.status === filter);
  const unpinned = items.filter((i) => i.kind === 'place' && i.place?.lat == null);

  return (
    <>
      <PageHeader
        title="Map"
        subtitle={`${places.length} place${places.length === 1 ? '' : 's'} pinned`}
        right={
          <div className="flex rounded-full bg-sunk p-0.5">
            {[
              ['todo', 'To visit'],
              ['done', 'Been'],
              ['all', 'All'],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`rounded-full px-3 py-1 text-[12px] font-medium ${filter === id ? 'bg-card text-ink shadow-sm' : 'text-ink-3'}`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />
      {places.length === 0 ? (
        <Empty emoji="🗺️" title="No places yet">
          Save a Google Maps link, a restaurant or a travel article, and it lands here as a pin.
        </Empty>
      ) : (
        <div className="mx-4 overflow-hidden rounded-2xl border border-line">
          <PlaceMap items={shown} className="h-[calc(100dvh-210px)] min-h-80 w-full" />
        </div>
      )}
      {unpinned.length > 0 && (
        <p className="mx-4 mt-3 text-[13px] text-ink-3">
          {unpinned.length} place{unpinned.length === 1 ? '' : 's'} without a location:{' '}
          {unpinned.slice(0, 3).map((i, n) => (
            <span key={i.id}>
              {n > 0 && ', '}
              <Link to={`/item/${i.id}`} className="underline">
                {i.title || 'Untitled'}
              </Link>
            </span>
          ))}
          {unpinned.length > 3 && '…'}
        </p>
      )}
    </>
  );
}
