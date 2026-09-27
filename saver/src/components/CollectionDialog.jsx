import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSaves } from '../stores/useSaves.js';
import { btnGhost, btnPrimary, input } from './ui.jsx';
import { useCloseOnBack } from '../lib/native.js';

const EMOJIS = ['📁', '✈️', '🍝', '☕', '🎁', '🏡', '💡', '🎉', '🌿', '🧘', '🎨', '📸', '🛒', '❤️', '🌙', '⭐'];

/** Create a collection, or edit one when `collection` is given. */
export default function CollectionDialog({ collection, onClose }) {
  const addCollection = useSaves((s) => s.addCollection);
  const renameCollection = useSaves((s) => s.renameCollection);
  const navigate = useNavigate();
  useCloseOnBack(onClose);
  const [name, setName] = useState(collection?.name || '');
  const [emoji, setEmoji] = useState(collection?.emoji || '📁');

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (collection) renameCollection(collection.id, { name: name.trim(), emoji });
    else navigate(`/collection/${addCollection(name, emoji)}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/40 animate-fade sm:items-center" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="animate-sheet w-full max-w-md rounded-t-3xl bg-paper p-5 safe-bottom sm:rounded-3xl"
      >
        <h2 className="font-display text-2xl">{collection ? 'Edit collection' : 'New collection'}</h2>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Goa trip, Sunday baking, Gift ideas"
          className={`${input} mt-3`}
          maxLength={60}
        />
        <div className="mt-3 grid grid-cols-8 gap-1.5">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`aspect-square rounded-xl text-xl transition ${emoji === e ? 'bg-accent-soft ring-2 ring-accent' : 'bg-sunk'}`}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancel
          </button>
          <button type="submit" disabled={!name.trim()} className={`${btnPrimary} flex-1`}>
            {collection ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
