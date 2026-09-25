import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, ImagePlus, Trash, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Tabs from '../components/ui/Tabs';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import MemoryCard from '../components/memories/MemoryCard';
import MemoryPhoto, { MEMORY_SCENES } from '../components/memories/MemoryPhoto';
import { useMemoryStore } from '../stores/memoryStore';
import { usePeopleStore } from '../stores/peopleStore';
import { useStoryStore } from '../stores/storyStore';
import { toast } from '../stores/uiStore';
import { uploadImage } from '../services/media/upload';
import { validateImageFile } from '../lib/sanitize';
import { formatDate } from '../lib/time';
import { usePartnerWords } from '../lib/words';
import { playSfx } from '../services/audio/sfx';

const REACTIONS = ['❤️', '🥹', '😂', '✨', '🌙', '🥰'];

function AddMemoryModal({ open, onClose }) {
  const me = usePeopleStore((s) => s.me);
  const add = useMemoryStore((s) => s.add);
  const [image, setImage] = useState(null);
  const [scene, setScene] = useState('sunset');
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const reset = () => {
    setImage(null);
    setCaption('');
    setLocation('');
    setError(null);
  };

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const err = validateImageFile(f);
    if (err) return setError(err);
    setBusy(true);
    setError(null);
    try {
      setImage(await uploadImage(f, { max: 1000 }));
    } catch (e2) {
      setError(e2.message);
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!caption.trim()) return setError('Give it a little caption');
    add({ image, scene, caption, date: new Date(date).toISOString(), location }, me.id);
    useStoryStore.getState().recordFirst('first-memory', '📸', 'First photo on the wall', caption);
    playSfx('success');
    toast('Pinned to the wall 📸', { emoji: '📌' });
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add a memory" className="sm:max-w-xl">
      <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
        <div>
          <div className="bg-[#f8f1e6] p-2 pb-8 shadow-soft">
            <div className="aspect-[4/5] overflow-hidden">
              <MemoryPhoto memory={{ image, scene, caption }} />
            </div>
          </div>
          <Button size="sm" className="mt-3 w-full" icon={ImagePlus} onClick={() => fileRef.current?.click()} loading={busy}>
            {image ? 'Change photo' : 'Upload a photo'}
          </Button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onFile} />
          {!image && (
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] text-muted">…or a painted one</p>
              <div className="grid grid-cols-5 gap-1">
                {MEMORY_SCENES.map((s) => (
                  <button key={s} onClick={() => setScene(s)} aria-label={`Painted scene: ${s}`} aria-pressed={scene === s} className={`aspect-square overflow-hidden rounded-md ring-2 ${scene === s ? 'ring-peach' : 'ring-transparent'}`}>
                    <MemoryPhoto memory={{ scene: s }} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="mem-cap" className="eyebrow mb-1.5 block">Caption</label>
            <input id="mem-cap" data-autofocus className="field" maxLength={140} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Our first virtual date ❤️" />
          </div>
          <div>
            <label htmlFor="mem-date" className="eyebrow mb-1.5 block">Date</label>
            <input id="mem-date" type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="mem-loc" className="eyebrow mb-1.5 block">Where (optional)</label>
            <input id="mem-loc" className="field" maxLength={60} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Two screens, one sunset" />
          </div>
          {error && <p className="text-sm text-rose" role="alert">{error}</p>}
          <div className="mt-auto flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={busy}>Pin it</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function MemoryDetail({ memory, onClose }) {
  const me = usePeopleStore((s) => s.me);
  const react = useMemoryStore((s) => s.react);
  const remove = useMemoryStore((s) => s.remove);
  const live = useMemoryStore((s) => s.memories.find((m) => m.id === memory?.id));
  const w = usePartnerWords();
  if (!live) return null;
  return (
    <Modal open={!!memory} onClose={onClose} className="sm:max-w-md">
      <div className="mx-auto max-w-sm rotate-[-1deg] bg-[#f8f1e6] p-3 pb-5 shadow-soft">
        <div className="aspect-[4/5] overflow-hidden">
          <MemoryPhoto memory={live} />
        </div>
        <p className="hand mt-3 text-2xl leading-tight text-[#3b3128]">{live.caption}</p>
        <p className="mt-1 flex items-center gap-2 text-xs uppercase tracking-wider text-[#8a7d6d]">
          {formatDate(live.date, { year: 'numeric', month: 'long', day: 'numeric' })}
          {live.location && (
            <span className="flex items-center gap-0.5 normal-case">
              <MapPin className="h-3 w-3" /> {live.location}
            </span>
          )}
        </p>
      </div>
      <div className="mt-5 flex items-center justify-between gap-2">
        <div className="flex gap-1" role="group" aria-label="React">
          {REACTIONS.map((e) => (
            <motion.button key={e} whileTap={{ scale: 0.8 }} onClick={() => react(live.id, me.id, e)} aria-pressed={live.reactions?.[me.id] === e} className={`grid h-9 w-9 place-items-center rounded-full text-lg transition ${live.reactions?.[me.id] === e ? 'bg-peach/20 ring-1 ring-peach/50' : 'hover:bg-surface-3'}`} aria-label={`React ${e}`}>
              {e}
            </motion.button>
          ))}
        </div>
        <button
          onClick={() => {
            remove(live.id);
            toast('Memory taken down', { emoji: '🧺' });
            onClose();
          }}
          className="rounded-lg p-2 text-faint hover:text-rose"
          aria-label="Delete memory"
        >
          <Trash className="h-4 w-4" />
        </button>
      </div>
      {Object.entries(live.reactions ?? {}).length > 0 && (
        <p className="mt-2 text-xs text-muted">
          {Object.entries(live.reactions)
            .map(([uid, e]) => `${uid === me.id ? 'You' : w.Subject} ${e}`)
            .join(' · ')}
        </p>
      )}
    </Modal>
  );
}

function Timeline({ memories, onOpen }) {
  const groups = useMemo(() => {
    const g = new Map();
    [...memories].sort((a, b) => new Date(b.date) - new Date(a.date)).forEach((m) => {
      const k = new Date(m.date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      if (!g.has(k)) g.set(k, []);
      g.get(k).push(m);
    });
    return [...g.entries()];
  }, [memories]);
  return (
    <div className="relative pl-6 sm:pl-10">
      <div className="absolute bottom-0 left-2 top-2 w-px bg-gradient-to-b from-peach/50 via-lavender/30 to-transparent sm:left-4" aria-hidden />
      {groups.map(([month, list]) => (
        <section key={month} className="mb-10">
          <h3 className="relative mb-4 font-display text-xl text-cream">
            <span className="absolute -left-[1.4rem] top-2 h-3 w-3 rounded-full bg-peach ring-4 ring-ink sm:-left-[1.9rem]" aria-hidden />
            {month}
          </h3>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((m, i) => (
              <MemoryCard key={m.id} memory={m} index={i} onOpen={onOpen} size="sm" />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Scrapbook({ memories, onOpen }) {
  const pages = useMemo(() => {
    const sorted = [...memories].sort((a, b) => new Date(a.date) - new Date(b.date));
    const out = [];
    for (let i = 0; i < sorted.length; i += 3) out.push(sorted.slice(i, i + 3));
    return out;
  }, [memories]);
  const [page, setPage] = useState(pages.length - 1);
  const [dir, setDir] = useState(1);
  const p = Math.min(page, pages.length - 1);
  const go = (d) => {
    setDir(d);
    setPage((x) => Math.max(0, Math.min(pages.length - 1, x + d)));
  };
  const doodles = ['✿', '☾', '♡', '✦', '☁︎'];
  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative overflow-hidden rounded-3xl p-6 shadow-soft sm:p-10" style={{ background: 'linear-gradient(135deg,#efe3d0,#e6d5bd)', perspective: 1200 }}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(#3b3128 1px, transparent 1px)', backgroundSize: '14px 14px' }} aria-hidden />
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={p} custom={dir} initial={{ rotateY: dir * 25, opacity: 0, x: dir * 40 }} animate={{ rotateY: 0, opacity: 1, x: 0 }} exit={{ rotateY: -dir * 25, opacity: 0, x: -dir * 40 }} transition={{ duration: 0.45 }} className="relative grid min-h-[420px] grid-cols-2 gap-6 sm:grid-cols-3">
            {pages[p]?.map((m, i) => (
              <div key={m.id} className={i === 1 ? 'sm:mt-16' : i === 2 ? 'col-span-2 mx-auto w-2/3 sm:col-span-1 sm:w-auto' : ''}>
                <MemoryCard memory={{ ...m, rotation: (i - 1) * 4 }} onOpen={onOpen} index={i} />
              </div>
            ))}
            <span className="hand absolute -bottom-2 right-2 text-2xl text-[#8a6d5a]">
              {doodles[p % doodles.length]} page {p + 1}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-4 flex items-center justify-center gap-3">
        <Button size="icon" onClick={() => go(-1)} disabled={p === 0} aria-label="Previous page" icon={ChevronLeft} />
        <span className="text-sm tabular-nums text-muted">
          {p + 1} / {pages.length}
        </span>
        <Button size="icon" onClick={() => go(1)} disabled={p >= pages.length - 1} aria-label="Next page" icon={ChevronRight} />
      </div>
    </div>
  );
}

export default function Memories() {
  const memories = useMemoryStore((s) => s.memories);
  const [view, setView] = useState('wall');
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(null);
  const sorted = useMemo(() => [...memories].sort((a, b) => new Date(b.date) - new Date(a.date)), [memories]);
  return (
    <div>
      <PageHeader eyebrow="Our memories" title="The wall of us" subtitle={`${memories.length} little moments, kept.`}>
        <Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>
          Add a memory
        </Button>
      </PageHeader>
      <Tabs tabs={[{ id: 'wall', label: 'Photo wall', emoji: '📌' }, { id: 'timeline', label: 'Timeline', emoji: '🗓️' }, { id: 'scrapbook', label: 'Scrapbook', emoji: '📔' }]} value={view} onChange={setView} layoutId="mem-tabs" className="mb-8" />
      {memories.length === 0 ? (
        <EmptyState emoji="📸" title="The wall is waiting" action={<Button variant="primary" onClick={() => setAdding(true)}>Pin the first one</Button>}>
          Screenshots of calls, sunsets you both saw, silly faces — all of it belongs here.
        </EmptyState>
      ) : view === 'wall' ? (
        <div className="rounded-4xl bg-[radial-gradient(circle_at_20%_10%,rgba(232,180,160,0.06),transparent_40%)] p-2 sm:p-4">
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {sorted.map((m, i) => (
              <MemoryCard key={m.id} memory={m} index={i} onOpen={setOpen} />
            ))}
          </div>
        </div>
      ) : view === 'timeline' ? (
        <Timeline memories={memories} onOpen={setOpen} />
      ) : (
        <Scrapbook memories={memories} onOpen={setOpen} />
      )}
      <AddMemoryModal open={adding} onClose={() => setAdding(false)} />
      <MemoryDetail memory={open} onClose={() => setOpen(null)} />
    </div>
  );
}
