import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import { searchItems, useSaves } from '../stores/useSaves.js';
import { KINDS } from '../lib/classify.js';
import { ItemGrid } from '../components/ItemCard.jsx';
import CollectionDialog from '../components/CollectionDialog.jsx';
import { Empty, PageHeader, btnPrimary, input } from '../components/ui.jsx';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'todo', label: 'To do' },
  { id: 'done', label: 'Done' },
];

export default function Home({ onAdd }) {
  const items = useSaves((s) => s.items);
  const collections = useSaves((s) => s.collections);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [newCol, setNewCol] = useState(false);

  const visible = useMemo(() => {
    const byStatus = filter === 'all' ? items : items.filter((i) => i.status === filter);
    return searchItems(byStatus, q);
  }, [items, filter, q]);

  const kindCounts = useMemo(() => {
    const c = {};
    for (const i of items) c[i.kind] = (c[i.kind] || 0) + 1;
    return c;
  }, [items]);

  const topTags = useMemo(() => {
    const c = {};
    for (const i of items) for (const t of i.tags || []) c[t] = (c[t] || 0) + 1;
    return Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([t]) => t);
  }, [items]);

  const todo = items.filter((i) => i.status === 'todo').length;

  return (
    <>
      <PageHeader
        title="Saver"
        subtitle={items.length ? `${items.length} saved · ${todo} still to do` : 'Everything you want to do, in one place'}
      />

      {items.length === 0 ? (
        <Empty emoji="🔖" title="Nothing saved yet">
          <p>Paste a link to a recipe, a place, a video or an article, or share it here from another app.</p>
          <button onClick={onAdd} className={`${btnPrimary} mt-4`}>
            <Plus size={16} /> Save your first thing
          </button>
        </Empty>
      ) : (
        <>
          <div className="px-4">
            <label className="relative block">
              <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search titles, notes, ingredients, tags…"
                className={`${input} rounded-full py-2.5 pl-11 pr-10`}
                type="search"
              />
              {q && (
                <button onClick={() => setQ('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-3">
                  <X size={16} />
                </button>
              )}
            </label>
          </div>

          {!q && (
            <section className="mt-5">
              <div className="flex items-baseline justify-between px-4">
                <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-3">Collections</h2>
              </div>
              <div className="no-scrollbar mt-2 flex gap-2.5 overflow-x-auto px-4 pb-1">
                {KINDS.filter((k) => kindCounts[k.id]).map((k) => (
                  <Link
                    key={k.id}
                    to={`/kind/${k.id}`}
                    className="flex w-28 shrink-0 flex-col justify-between rounded-2xl p-3 transition active:scale-95"
                    style={{ background: `${k.color}1c` }}
                  >
                    <span className="text-2xl">{k.emoji}</span>
                    <span className="mt-4 text-[14px] font-semibold" style={{ color: k.color }}>
                      {k.label}
                    </span>
                    <span className="text-xs text-ink-3">{kindCounts[k.id]}</span>
                  </Link>
                ))}
                {collections.map((c) => (
                  <Link
                    key={c.id}
                    to={`/collection/${c.id}`}
                    className="flex w-28 shrink-0 flex-col justify-between rounded-2xl border border-line bg-card p-3 transition active:scale-95"
                  >
                    <span className="text-2xl">{c.emoji}</span>
                    <span className="mt-4 truncate text-[14px] font-semibold">{c.name}</span>
                    <span className="text-xs text-ink-3">{items.filter((i) => i.collectionIds.includes(c.id)).length}</span>
                  </Link>
                ))}
                <button
                  onClick={() => setNewCol(true)}
                  className="flex w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-line-2 p-3 text-ink-3 transition active:scale-95"
                >
                  <Plus size={22} />
                  <span className="text-[13px]">New collection</span>
                </button>
              </div>
            </section>
          )}

          {topTags.length > 0 && (
            <div className="no-scrollbar mt-4 flex gap-1.5 overflow-x-auto px-4">
              {topTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setQ(q === t ? '' : t)}
                  className={`shrink-0 rounded-full px-3 py-1 text-[12px] ${q === t ? 'bg-ink text-paper' : 'bg-sunk text-ink-2'}`}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}

          <section className="mt-5">
            <div className="mb-3 flex items-center justify-between px-4">
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-3">
                {q ? `${visible.length} result${visible.length === 1 ? '' : 's'}` : 'Recently saved'}
              </h2>
              <div className="flex rounded-full bg-sunk p-0.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`rounded-full px-3 py-1 text-[12px] font-medium transition ${
                      filter === f.id ? 'bg-card text-ink shadow-sm' : 'text-ink-3'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            {visible.length ? (
              <ItemGrid items={visible} />
            ) : (
              <p className="px-4 py-10 text-center text-sm text-ink-3">Nothing here{q ? ` for “${q}”` : ''}.</p>
            )}
          </section>
        </>
      )}

      {newCol && <CollectionDialog onClose={() => setNewCol(false)} />}
    </>
  );
}
