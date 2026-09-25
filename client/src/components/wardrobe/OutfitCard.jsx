import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Pencil, Trash, Check } from 'lucide-react';
import Avatar from '../avatar/Avatar';
import { cn } from '../../lib/cn';

export default function OutfitCard({ outfit, base, worn, onWear, onRename, onFavorite, onDelete, index = 0 }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(outfit.name);
  const save = () => {
    if (name.trim() && name.trim() !== outfit.name) onRename(name.trim());
    setEditing(false);
  };
  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.04 }} className={cn('card group relative flex flex-col items-center p-4', worn && 'ring-1 ring-peach/50')}>
      <button onClick={onFavorite} className={cn('absolute left-3 top-3 rounded-lg p-1.5 transition', outfit.favorite ? 'text-lamp' : 'text-faint hover:text-cream')} aria-label={outfit.favorite ? 'Remove from favourites' : 'Add to favourites'} aria-pressed={outfit.favorite}>
        <Star className="h-4 w-4" fill={outfit.favorite ? 'currentColor' : 'none'} />
      </button>
      <div className="absolute right-3 top-3 flex gap-0.5 opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        <button onClick={() => setEditing(true)} className="rounded-lg p-1.5 text-faint hover:text-cream" aria-label={`Rename ${outfit.name}`}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={onDelete} className="rounded-lg p-1.5 text-faint hover:text-rose" aria-label={`Delete ${outfit.name}`}>
          <Trash className="h-3.5 w-3.5" />
        </button>
      </div>
      <button onClick={onWear} className="mt-2" aria-label={`Wear ${outfit.name}`}>
        <Avatar config={{ ...base, outfit: outfit.items }} size={170} animated={false} label={outfit.name} />
      </button>
      {editing ? (
        <form
          className="mt-2 flex w-full gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <label className="sr-only" htmlFor={`rename-${outfit.id}`}>Outfit name</label>
          <input id={`rename-${outfit.id}`} autoFocus className="field py-1.5 text-center" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} onBlur={save} />
          <button className="rounded-xl bg-surface-3 px-2" aria-label="Save name">
            <Check className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <p className="mt-2 text-center text-[15px] text-cream">
          {outfit.name} <span aria-hidden>{outfit.emoji}</span>
        </p>
      )}
      <button onClick={onWear} className={cn('mt-3 w-full rounded-xl py-2 text-xs font-medium transition', worn ? 'bg-peach/15 text-peach' : 'bg-surface-3 text-cream-dim hover:text-cream')}>
        {worn ? 'Wearing now' : 'Wear this'}
      </button>
    </motion.div>
  );
}
