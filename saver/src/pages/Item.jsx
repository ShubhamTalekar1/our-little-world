import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle, Check, ChevronLeft, Clock, ExternalLink, Loader2, MapPin, Navigation, Pencil, RefreshCw, Trash2, Users, X,
} from 'lucide-react';
import { useSaves } from '../stores/useSaves.js';
import { KINDS } from '../lib/classify.js';
import { geocode } from '../lib/fetchPage.js';
import PlaceMap from '../components/PlaceMap.jsx';
import { Cover, Empty, Stars, btn, btnGhost, btnPrimary, input } from '../components/ui.jsx';

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const fmtMins = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`);

export default function Item() {
  const { id } = useParams();
  const navigate = useNavigate();
  const item = useSaves((s) => s.items.find((i) => i.id === id));
  const { update, remove, refresh, setDone } = useSaves.getState();

  if (!item) {
    return (
      <div className="pt-10">
        <Empty emoji="🫥" title="This save is gone">It may have been deleted.</Empty>
      </div>
    );
  }

  const set = (patch) => update(item.id, patch);
  const done = item.status === 'done';
  const showRecipe = item.kind === 'recipe' || item.recipe;
  const showPlace = item.kind === 'place' || item.place;

  return (
    <article className="pb-6">
      <div className="safe-top sticky top-0 z-[500] flex items-center gap-1 bg-paper/90 px-2 py-2 backdrop-blur-lg">
        <button onClick={() => (history.length > 1 ? navigate(-1) : navigate('/'))} aria-label="Back" className="rounded-full p-2 text-ink-2">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1" />
        {item.url && (
          <button
            onClick={() => refresh(item.id)}
            disabled={item.fetchState === 'pending'}
            aria-label="Fetch details again"
            title="Fetch details again"
            className="rounded-full p-2 text-ink-2 disabled:opacity-40"
          >
            <RefreshCw size={19} className={item.fetchState === 'pending' ? 'animate-spin' : ''} />
          </button>
        )}
        <button
          onClick={() => {
            if (confirm('Delete this save?')) {
              remove(item.id);
              navigate('/', { replace: true });
            }
          }}
          aria-label="Delete"
          className="rounded-full p-2 text-ink-2"
        >
          <Trash2 size={19} />
        </button>
        {item.url && (
          <a href={item.url} target="_blank" rel="noreferrer" className={`${btnGhost} ml-1 py-1.5`}>
            Open <ExternalLink size={14} />
          </a>
        )}
      </div>

      <div className="px-4">
        {item.embedUrl && item.kind !== 'place' ? (
          <div className="overflow-hidden rounded-2xl bg-black">
            <iframe
              src={item.embedUrl}
              title={item.title || 'Video'}
              className={`w-full ${/tiktok/.test(item.embedUrl) ? 'aspect-[9/16] max-h-[70vh]' : 'aspect-video'}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              loading="lazy"
            />
          </div>
        ) : item.image || item.fetchState !== 'pending' ? (
          (item.image || !showPlace || item.place?.lat == null) && (
            <Cover item={item} className="aspect-[16/10] w-full rounded-2xl" />
          )
        ) : (
          <div className="skeleton aspect-[16/10] w-full rounded-2xl" />
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            value={item.kind}
            onChange={(e) => set({ kind: e.target.value })}
            aria-label="Kind"
            className="rounded-full border border-line-2 bg-card px-3 py-1 text-[13px] text-ink-2"
          >
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.emoji} {k.label}
              </option>
            ))}
          </select>
          {item.siteName && <span className="text-[13px] text-ink-3">{item.siteName}</span>}
          {item.author && <span className="text-[13px] text-ink-3">· {item.author}</span>}
        </div>

        <EditableText
          value={item.title}
          onSave={(title) => set({ title })}
          multiline={false}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), e.currentTarget.blur())}
          placeholder="Add a title"
          className="mt-2 w-full resize-none bg-transparent font-display text-[34px] leading-[1.1] outline-none placeholder:text-ink-3"
        />

        {item.fetchState === 'pending' && (
          <p className="mt-2 flex items-center gap-2 text-sm text-ink-3">
            <Loader2 size={15} className="animate-spin" /> Fetching details…
          </p>
        )}
        {item.fetchState === 'failed' && (
          <p className="mt-2 flex items-start gap-2 rounded-xl bg-sunk px-3 py-2 text-[13px] text-ink-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>
              Couldn’t read this page, so fill in what you want to keep. Some sites block previews; setting up your own
              proxy in Settings helps a lot.
            </span>
          </p>
        )}

        {item.description && <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{item.description}</p>}

        <DoneBlock item={item} setDone={setDone} />

        {showRecipe && <RecipeBlock item={item} set={set} />}
        {showPlace && <PlaceBlock item={item} set={set} />}

        <Section title="Notes">
          <EditableText
            value={item.notes}
            onSave={(notes) => set({ notes })}
            placeholder="Why you saved it, who recommended it, what to order…"
            className={`${input} min-h-24 resize-none`}
            multiline
          />
        </Section>

        <TagsBlock item={item} set={set} />
        <CollectionsBlock item={item} />

        <p className="mt-8 text-center text-xs text-ink-3">
          Saved {fmtDate(item.createdAt)}
          {item.url && (
            <>
              <br />
              <span className="break-all">{item.url}</span>
            </>
          )}
        </p>
      </div>
    </article>
  );
}

function Section({ title, action, children }) {
  return (
    <section className="mt-7">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-3">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Text that saves when you leave the field, so typing doesn't write on every keystroke. */
function EditableText({ value, onSave, multiline = true, ...props }) {
  const [draft, setDraft] = useState(value || '');
  useEffect(() => setDraft(value || ''), [value]);
  const commit = () => draft !== (value || '') && onSave(draft.trim());
  const autosize = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };
  return (
    <textarea
      ref={autosize}
      rows={1}
      value={draft}
      onChange={(e) => {
        setDraft(multiline ? e.target.value : e.target.value.replace(/\n/g, ' '));
        autosize(e.target);
      }}
      onBlur={commit}
      {...props}
    />
  );
}

function DoneBlock({ item, setDone }) {
  const done = item.status === 'done';
  const [note, setNote] = useState(item.doneNote || '');
  useEffect(() => setNote(item.doneNote || ''), [item.doneNote]);
  const verb = { recipe: 'Cooked it', place: 'Been there', video: 'Watched it', book: 'Read it', article: 'Read it', workout: 'Did it', music: 'Listened' }[item.kind] || 'Done';

  if (!done) {
    return (
      <button onClick={() => setDone(item.id, true)} className={`${btnPrimary} mt-5 w-full py-3 text-[15px]`}>
        <Check size={18} strokeWidth={2.6} /> {verb}
      </button>
    );
  }
  return (
    <div className="mt-5 rounded-2xl bg-good-soft p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[15px] font-semibold text-good">
          <Check size={18} strokeWidth={3} /> {verb} · {fmtDate(item.doneAt)}
        </p>
        <button onClick={() => setDone(item.id, false)} className="text-[13px] text-ink-2 underline underline-offset-2">
          Undo
        </button>
      </div>
      <div className="mt-3">
        <Stars value={item.rating} onChange={(rating) => setDone(item.id, true, { rating })} />
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => note !== item.doneNote && setDone(item.id, true, { doneNote: note.trim() })}
        rows={2}
        placeholder="How was it? Would you do it again?"
        className="mt-2 w-full resize-none rounded-xl bg-card/70 px-3 py-2 text-[14px] outline-none placeholder:text-ink-3"
      />
    </div>
  );
}

function RecipeBlock({ item, set }) {
  const r = item.recipe || { ingredients: [], steps: [], checked: [] };
  const [editing, setEditing] = useState(false);
  const [ing, setIng] = useState('');
  const [steps, setSteps] = useState('');
  const checked = new Set(r.checked || []);
  const empty = !r.ingredients?.length && !r.steps?.length;

  const startEdit = () => {
    setIng((r.ingredients || []).join('\n'));
    setSteps((r.steps || []).join('\n'));
    setEditing(true);
  };
  const saveEdit = () => {
    const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);
    set({ recipe: { ...r, ingredients: lines(ing), steps: lines(steps), checked: [] } });
    setEditing(false);
  };
  const toggle = (i) => {
    const next = new Set(checked);
    next.has(i) ? next.delete(i) : next.add(i);
    useSaves.getState().update(item.id, { recipe: { ...r, checked: [...next] } }, { quiet: true });
  };

  if (editing) {
    return (
      <Section title="Recipe">
        <label className="text-[13px] text-ink-2">Ingredients, one per line</label>
        <textarea value={ing} onChange={(e) => setIng(e.target.value)} rows={6} className={`${input} mt-1 text-[14px]`} />
        <label className="mt-3 block text-[13px] text-ink-2">Steps, one per line</label>
        <textarea value={steps} onChange={(e) => setSteps(e.target.value)} rows={6} className={`${input} mt-1 text-[14px]`} />
        <div className="mt-3 flex gap-2">
          <button onClick={() => setEditing(false)} className={btnGhost}>
            Cancel
          </button>
          <button onClick={saveEdit} className={`${btnPrimary} flex-1`}>
            Save recipe
          </button>
        </div>
      </Section>
    );
  }

  if (empty) {
    return (
      <Section title="Recipe">
        <button onClick={startEdit} className="w-full rounded-2xl border border-dashed border-line-2 px-4 py-5 text-[14px] text-ink-2">
          {item.fetchState === 'pending' ? 'Looking for the recipe…' : 'No recipe found on the page. Tap to add ingredients and steps.'}
        </button>
      </Section>
    );
  }

  return (
    <>
      {(r.totalMinutes || r.servings) && (
        <div className="mt-6 flex gap-2">
          {r.totalMinutes ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sunk px-3 py-1.5 text-[13px]">
              <Clock size={14} /> {fmtMins(r.totalMinutes)}
            </span>
          ) : null}
          {r.servings && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sunk px-3 py-1.5 text-[13px]">
              <Users size={14} /> {r.servings}
            </span>
          )}
        </div>
      )}
      <Section
        title={`Ingredients · ${r.ingredients.length}`}
        action={
          <button onClick={startEdit} className="flex items-center gap-1 text-[13px] text-ink-3">
            <Pencil size={13} /> Edit
          </button>
        }
      >
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
          {r.ingredients.map((x, i) => (
            <li key={i}>
              <label className="flex cursor-pointer items-start gap-3 px-4 py-2.5 text-[15px]">
                <input type="checkbox" checked={checked.has(i)} onChange={() => toggle(i)} className="mt-1 h-4 w-4 accent-[var(--accent)]" />
                <span className={checked.has(i) ? 'text-ink-3 line-through' : ''}>{x}</span>
              </label>
            </li>
          ))}
        </ul>
        {checked.size > 0 && (
          <button onClick={() => useSaves.getState().update(item.id, { recipe: { ...r, checked: [] } }, { quiet: true })} className="mt-2 text-[13px] text-ink-3 underline">
            Clear ticks
          </button>
        )}
      </Section>
      {r.steps.length > 0 && (
        <Section title="Method">
          <ol className="space-y-3">
            {r.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft text-[13px] font-semibold text-accent">
                  {i + 1}
                </span>
                <p className="pt-0.5 text-[15px] leading-relaxed">{s}</p>
              </li>
            ))}
          </ol>
        </Section>
      )}
    </>
  );
}

function PlaceBlock({ item, set }) {
  const p = item.place || {};
  const hasCoords = p.lat != null;
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const locate = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const g = await geocode(query);
      if (!g) setErr('No match. Try adding the city or country.');
      else {
        set({ place: { ...p, lat: g.lat, lng: g.lng, address: g.address, name: p.name || query.trim() } });
        setQuery('');
      }
    } catch {
      setErr('Couldn’t reach the map search. Check your connection.');
    }
    setBusy(false);
  };

  const q = hasCoords ? `${p.lat},${p.lng}` : p.address || p.name || item.title;
  const gmaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;

  return (
    <Section title="Place">
      {hasCoords ? (
        <div className="overflow-hidden rounded-2xl border border-line">
          <PlaceMap items={[item]} interactive={false} className="h-56 w-full" />
          <div className="bg-card px-4 py-3">
            {p.name && p.name !== item.title && <p className="font-medium">{p.name}</p>}
            {p.address && <p className="text-[13px] text-ink-2">{p.address}</p>}
            <div className="mt-3 flex gap-2">
              <a href={gmaps} target="_blank" rel="noreferrer" className={`${btnGhost} flex-1`}>
                <MapPin size={15} /> Open in Maps
              </a>
              <a href={directions} target="_blank" rel="noreferrer" className={`${btnGhost} flex-1`}>
                <Navigation size={15} /> Directions
              </a>
            </div>
            <button
              onClick={() => set({ place: { name: p.name } })}
              className="mt-2 flex items-center gap-1 text-[12px] text-ink-3"
            >
              <X size={12} /> Wrong spot? Clear the pin
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={locate} className="rounded-2xl border border-dashed border-line-2 p-4">
          <p className="text-[14px] text-ink-2">
            {item.fetchState === 'pending' ? 'Finding it on the map…' : 'Pin it on your map: type a name and city, or an address.'}
          </p>
          <div className="mt-2 flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={p.name || 'e.g. Café Mondegar, Mumbai'}
              className={`${input} py-2.5`}
            />
            <button disabled={busy || !query.trim()} className={`${btn} bg-ink text-paper`}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : 'Find'}
            </button>
          </div>
          {err && <p className="mt-2 text-[13px] text-accent">{err}</p>}
        </form>
      )}
    </Section>
  );
}

function TagsBlock({ item, set }) {
  const [draft, setDraft] = useState('');
  const add = (e) => {
    e.preventDefault();
    const t = draft.trim().replace(/^#/, '').toLowerCase();
    if (t && !item.tags.includes(t)) set({ tags: [...item.tags, t] });
    setDraft('');
  };
  return (
    <Section title="Tags">
      <form onSubmit={add} className="flex flex-wrap items-center gap-1.5">
        {item.tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-sunk py-1 pl-3 pr-1.5 text-[13px]">
            #{t}
            <button type="button" onClick={() => set({ tags: item.tags.filter((x) => x !== t) })} aria-label={`Remove ${t}`} className="rounded-full p-0.5 text-ink-3">
              <X size={13} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={add}
          placeholder="+ add tag"
          className="w-24 bg-transparent px-2 py-1 text-[13px] outline-none placeholder:text-ink-3"
        />
      </form>
    </Section>
  );
}

function CollectionsBlock({ item }) {
  const collections = useSaves((s) => s.collections);
  const toggle = useSaves((s) => s.toggleInCollection);
  if (!collections.length) return null;
  return (
    <Section title="In collections">
      <div className="flex flex-wrap gap-1.5">
        {collections.map((c) => {
          const on = item.collectionIds.includes(c.id);
          return (
            <button
              key={c.id}
              onClick={() => toggle(item.id, c.id)}
              className={`rounded-full border px-3 py-1.5 text-[13px] transition ${on ? 'border-ink bg-ink text-paper' : 'border-line-2 text-ink-2'}`}
            >
              {c.emoji} {c.name}
            </button>
          );
        })}
      </div>
    </Section>
  );
}
