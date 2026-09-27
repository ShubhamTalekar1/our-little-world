import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSaves } from '../stores/useSaves.js';
import { kindInfo } from '../lib/classify.js';
import { Cover, Empty, PageHeader, Stars } from '../components/ui.jsx';

export default function Done() {
  const items = useSaves((s) => s.items);
  const done = useMemo(
    () => items.filter((i) => i.status === 'done').sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || '')),
    [items]
  );
  const months = useMemo(() => {
    const m = new Map();
    for (const i of done) {
      const key = new Date(i.doneAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(i);
    }
    return [...m.entries()];
  }, [done]);

  const thisYear = done.filter((i) => new Date(i.doneAt).getFullYear() === new Date().getFullYear());
  const byKind = Object.entries(
    thisYear.reduce((acc, i) => ({ ...acc, [i.kind]: (acc[i.kind] || 0) + 1 }), {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <PageHeader title="Done" subtitle={done.length ? `${done.length} things you actually did` : undefined} />
      {done.length === 0 ? (
        <Empty emoji="✅" title="Nothing ticked off yet">
          When you cook the recipe, visit the place or watch the video, mark it done. It’ll show up here with your rating.
        </Empty>
      ) : (
        <>
          {byKind.length > 0 && (
            <div className="no-scrollbar mx-4 flex gap-2 overflow-x-auto">
              <div className="shrink-0 rounded-2xl bg-accent-soft px-4 py-3">
                <p className="font-display text-3xl leading-none text-accent">{thisYear.length}</p>
                <p className="mt-1 text-[12px] text-ink-2">this year</p>
              </div>
              {byKind.map(([k, n]) => (
                <div key={k} className="shrink-0 rounded-2xl bg-sunk px-4 py-3">
                  <p className="font-display text-3xl leading-none">
                    {n} <span className="text-xl">{kindInfo(k).emoji}</span>
                  </p>
                  <p className="mt-1 text-[12px] text-ink-2">{kindInfo(k).label.toLowerCase()}</p>
                </div>
              ))}
            </div>
          )}
          {months.map(([month, list]) => (
            <section key={month} className="mt-6 px-4">
              <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wider text-ink-3">{month}</h2>
              <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
                {list.map((i) => (
                  <Link key={i.id} to={`/item/${i.id}`} className="flex gap-3 p-3">
                    <Cover item={i} className="h-16 w-16 shrink-0 rounded-xl text-2xl" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{i.title || 'Untitled'}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-[12px] text-ink-3">
                        <span>{new Date(i.doneAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                        {i.rating > 0 && <Stars value={i.rating} size={12} />}
                      </div>
                      {i.doneNote && <p className="mt-1 line-clamp-2 text-[13px] italic text-ink-2">“{i.doneNote}”</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </>
  );
}
