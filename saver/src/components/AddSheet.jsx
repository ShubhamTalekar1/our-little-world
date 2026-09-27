import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardPaste, X } from 'lucide-react';
import { useSaves } from '../stores/useSaves.js';
import { KINDS } from '../lib/classify.js';
import { findUrl } from '../lib/links.js';
import { btnGhost, btnPrimary, input } from './ui.jsx';

export default function AddSheet({ onClose, defaults = {} }) {
  const add = useSaves((s) => s.add);
  const collections = useSaves((s) => s.collections);
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [kind, setKind] = useState(defaults.kind || 'auto');
  const [colId, setColId] = useState(defaults.collectionId || '');
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const paste = async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (t) setText(t);
    } catch {
      ref.current?.focus();
    }
  };

  const save = (e) => {
    e?.preventDefault();
    if (!text.trim()) return;
    const id = add(text, {
      ...(kind !== 'auto' ? { kind } : {}),
      ...(colId ? { collectionIds: [colId] } : {}),
    });
    onClose();
    navigate(`/item/${id}`);
  };

  const hasUrl = Boolean(findUrl(text));

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/40 animate-fade sm:items-center" onClick={onClose}>
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="animate-sheet w-full max-w-lg rounded-t-3xl bg-paper p-4 shadow-2xl safe-bottom sm:rounded-3xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl">Save something</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-ink-2 hover:bg-sunk">
            <X size={20} />
          </button>
        </div>

        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && save(e)}
          rows={3}
          placeholder="Paste a link, or jot down an idea…"
          className={`${input} resize-none`}
        />
        <p className="mt-1.5 px-1 text-xs text-ink-3">
          {hasUrl
            ? 'Saver will fetch the title, picture and details, then sort it for you.'
            : text.trim()
              ? 'No link: this will be saved as a note.'
              : 'Links to recipes, places, videos, books and articles are recognised automatically.'}
        </p>

        <div className="no-scrollbar -mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4">
          <Chip active={kind === 'auto'} onClick={() => setKind('auto')}>
            ✨ Auto
          </Chip>
          {KINDS.filter((k) => k.id !== 'other').map((k) => (
            <Chip key={k.id} active={kind === k.id} onClick={() => setKind(k.id)}>
              {k.emoji} {k.label}
            </Chip>
          ))}
        </div>

        {collections.length > 0 && (
          <select value={colId} onChange={(e) => setColId(e.target.value)} className={`${input} mt-3 py-2.5`}>
            <option value="">No collection</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        )}

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={paste} className={btnGhost}>
            <ClipboardPaste size={16} /> Paste
          </button>
          <button type="submit" disabled={!text.trim()} className={`${btnPrimary} flex-1`}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

function Chip({ active, children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-[13px] transition ${
        active ? 'border-ink bg-ink text-paper' : 'border-line-2 text-ink-2'
      }`}
    >
      {children}
    </button>
  );
}
