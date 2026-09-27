import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { useSaves } from '../stores/useSaves.js';
import { kindInfo } from '../lib/classify.js';
import { ItemGrid } from '../components/ItemCard.jsx';
import AddSheet from '../components/AddSheet.jsx';
import CollectionDialog from '../components/CollectionDialog.jsx';
import PlaceMap from '../components/PlaceMap.jsx';
import { Empty, PageHeader } from '../components/ui.jsx';

export default function Collection() {
  const { kind, id } = useParams();
  const navigate = useNavigate();
  const items = useSaves((s) => s.items);
  const collection = useSaves((s) => s.collections.find((c) => c.id === id));
  const removeCollection = useSaves((s) => s.removeCollection);
  const [showDone, setShowDone] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);

  const k = kind ? kindInfo(kind) : null;
  const all = useMemo(
    () => items.filter((i) => (kind ? i.kind === kind : i.collectionIds.includes(id))),
    [items, kind, id]
  );
  const list = showDone ? all : all.filter((i) => i.status !== 'done');
  const done = all.filter((i) => i.status === 'done').length;
  const withPlaces = all.filter((i) => i.place?.lat != null);

  if (id && !collection) {
    return <Empty emoji="🤷" title="Collection not found">It may have been deleted.</Empty>;
  }

  const title = k ? `${k.emoji} ${k.label}` : `${collection.emoji} ${collection.name}`;

  return (
    <>
      <PageHeader
        title={title}
        subtitle={`${all.length} saved${all.length ? ` · ${done} done` : ''}`}
        left={
          <button onClick={() => navigate(-1)} aria-label="Back" className="-ml-2 rounded-full p-2 text-ink-2">
            <ChevronLeft size={24} />
          </button>
        }
        right={
          <div className="flex">
            {collection && (
              <>
                <button onClick={() => setEditing(true)} aria-label="Edit collection" className="rounded-full p-2 text-ink-2">
                  <Pencil size={19} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete “${collection.name}”? The saves in it stay.`)) {
                      removeCollection(collection.id);
                      navigate('/');
                    }
                  }}
                  aria-label="Delete collection"
                  className="rounded-full p-2 text-ink-2"
                >
                  <Trash2 size={19} />
                </button>
              </>
            )}
            <button onClick={() => setAdding(true)} aria-label="Add to this collection" className="rounded-full p-2 text-ink-2">
              <Plus size={22} />
            </button>
          </div>
        }
      />

      {withPlaces.length > 0 && (
        <div className="mx-4 mb-4 overflow-hidden rounded-2xl border border-line">
          <PlaceMap items={withPlaces} className="h-48 w-full" />
        </div>
      )}

      {all.length === 0 ? (
        <Empty emoji={k?.emoji || collection.emoji} title="Empty for now">
          Tap + to add something{collection ? ', or add saves from their page.' : '.'}
        </Empty>
      ) : (
        <>
          {done > 0 && (
            <label className="mb-3 flex items-center justify-end gap-2 px-4 text-[13px] text-ink-2">
              <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} className="accent-[var(--accent)]" />
              Show done
            </label>
          )}
          <ItemGrid items={list} />
        </>
      )}

      {adding && (
        <AddSheet onClose={() => setAdding(false)} defaults={kind ? { kind } : { collectionId: id }} />
      )}
      {editing && <CollectionDialog collection={collection} onClose={() => setEditing(false)} />}
    </>
  );
}
