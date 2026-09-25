import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const EMOJIS = ['❤️', '☕', '🎬', '💞', '🌙', '✨', '🌧️', '🌷', '🥂', '🧣', '🌊', '🍂'];

export default function SaveOutfitModal({ open, onClose, onSave, initialName = '', initialEmoji = '✨', title = 'Save this outfit' }) {
  const [name, setName] = useState(initialName);
  const [emoji, setEmoji] = useState(initialEmoji);
  useEffect(() => {
    if (open) {
      setName(initialName);
      setEmoji(initialEmoji);
    }
  }, [open, initialName, initialEmoji]);
  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), emoji);
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={submit}>
        <label htmlFor="outfit-name" className="eyebrow mb-2 block">Name</label>
        <input id="outfit-name" data-autofocus className="field" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Date Night, Cozy Sunday…" />
        <p className="eyebrow mb-2 mt-5">A little symbol</p>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Outfit symbol">
          {EMOJIS.map((e) => (
            <button type="button" key={e} role="radio" aria-checked={emoji === e} onClick={() => setEmoji(e)} className={`grid h-10 w-10 place-items-center rounded-xl text-lg transition ${emoji === e ? 'bg-peach/20 ring-1 ring-peach/60' : 'bg-surface-3/60 hover:bg-surface-3'}`}>
              {e}
            </button>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={!name.trim()}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}
