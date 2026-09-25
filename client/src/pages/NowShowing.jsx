import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Ticket, Trash, Upload, MonitorPlay, TvMinimalPlay, Link2, ArrowRight } from 'lucide-react';
import Poster from '../components/cinema/Poster';
import TicketCard from '../components/cinema/TicketCard';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { useCinemaStore } from '../stores/cinemaStore';
import { usePeopleStore } from '../stores/peopleStore';
import { toast } from '../stores/uiStore';
import { usePartnerWords } from '../lib/words';
import { POSTER_PALETTES } from '../lib/poster';
import { GENRES } from '../catalog/videos';
import { parseYouTubeId } from '../services/movie/youtube';
import { uploadImage } from '../services/media/upload';
import { validateImageFile } from '../lib/sanitize';
import { playSfx } from '../services/audio/sfx';
import { cn } from '../lib/cn';

function sourceLabel(film, meId, w) {
  if (film.kind === 'house') return `${film.genre} · ${film.runtime}`;
  if (film.kind === 'stream') return film.hostId === meId ? 'Streamed from your device' : `Streamed by ${w.Subject}`;
  if (film.kind === 'youtube') return 'From YouTube';
  return 'From the web';
}

/** Marquee lettering with chasing bulbs. */
function Marquee() {
  return (
    <div className="relative mx-auto max-w-xl rounded-2xl border border-[#c9a15b]/40 bg-[#1a0f15] px-6 py-4 text-center shadow-[0_0_60px_-20px_rgba(242,201,139,0.5)]">
      <div className="pointer-events-none absolute inset-1.5 rounded-xl" aria-hidden>
        {Array.from({ length: 28 }, (_, i) => {
          const side = i < 10 ? 'top' : i < 20 ? 'bottom' : i < 24 ? 'left' : 'right';
          const k = side === 'top' || side === 'bottom' ? (i % 10) / 9 : ((i - 20) % 4) / 3;
          const style = side === 'top' ? { top: 0, left: `${k * 100}%` } : side === 'bottom' ? { bottom: 0, left: `${k * 100}%` } : { [side]: 0, top: `${15 + k * 70}%` };
          return <span key={i} className="marquee-bulb absolute h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-lamp" style={{ ...style, animationDelay: `${(i % 4) * 0.25}s` }} />;
        })}
      </div>
      <p className="text-[10px] uppercase tracking-[0.5em] text-lamp/80">Our Little World Cinema</p>
      <h1 className="mt-1 font-display text-4xl tracking-wide text-cream sm:text-5xl">Now Showing</h1>
    </div>
  );
}

function AddFilm({ open, onClose }) {
  const me = usePeopleStore((s) => s.me);
  const addShowing = useCinemaStore((s) => s.addShowing);
  const w = usePartnerWords();
  const [form, setForm] = useState({ title: '', tagline: '', genre: 'Comedy', palette: 0, kind: 'stream', link: '', when: '' });
  const [poster, setPoster] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.value ?? e }));
  useEffect(() => {
    if (open) {
      setForm({ title: '', tagline: '', genre: 'Comedy', palette: Math.floor(Math.random() * POSTER_PALETTES.length), kind: 'stream', link: '', when: '' });
      setPoster(null);
    }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast('Give the film a title', { emoji: '🎬', tone: 'error' });
    let source = null;
    if (form.kind === 'youtube') {
      source = parseYouTubeId(form.link.trim());
      if (!source) return toast('That doesn’t look like a YouTube link', { emoji: '🔗', tone: 'error' });
    }
    if (form.kind === 'link') {
      source = form.link.trim();
      if (!/^https:\/\/\S+$/i.test(source)) return toast('Paste a link that starts with https://', { emoji: '🔗', tone: 'error' });
    }
    setBusy(true);
    try {
      await addShowing({ title: form.title, tagline: form.tagline, genre: form.genre, palette: form.palette, poster, kind: form.kind, source, startsAt: form.when ? new Date(form.when).toISOString() : null }, me?.id);
      playSfx('success');
      toast(`${form.title} is now showing`, { emoji: '🎬' });
      onClose();
    } catch (err) {
      toast(err.message || 'Couldn’t add that film', { emoji: '☁️', tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const preview = { title: form.title || 'Your film', tagline: form.tagline, genre: form.genre, palette: form.palette, poster, startsAt: form.when ? new Date(form.when).toISOString() : null };
  return (
    <Modal open={open} onClose={onClose} title="Put a film on" className="sm:max-w-3xl">
      <form onSubmit={submit} className="grid gap-5 sm:grid-cols-[200px_1fr]">
        <div className="mx-auto w-40 sm:w-full">
          <Poster film={preview} />
          <div className="mt-3 flex flex-wrap justify-center gap-1.5" role="radiogroup" aria-label="Poster colours">
            {POSTER_PALETTES.map((p, i) => (
              <button key={i} type="button" role="radio" aria-checked={form.palette === i} aria-label={`Palette ${i + 1}`} onClick={() => setForm((f) => ({ ...f, palette: i }))} className={cn('h-6 w-6 rounded-full ring-2 transition', form.palette === i ? 'ring-cream' : 'ring-transparent')} style={{ background: `linear-gradient(135deg, ${p[0]}, ${p[1]} 60%, ${p[2]})` }} />
            ))}
          </div>
          <Button type="button" size="sm" variant="ghost" icon={Upload} className="mt-2 w-full" onClick={() => fileRef.current?.click()}>
            {poster ? 'Change poster image' : 'Use my own image'}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const problem = validateImageFile(f);
              if (problem) return toast(problem, { emoji: '🖼️', tone: 'error' });
              try {
                setPoster(await uploadImage(f, { max: 900 }));
              } catch (err) {
                toast(err.message || 'Couldn’t upload that image', { emoji: '☁️', tone: 'error' });
              }
            }}
          />
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="film-title" className="eyebrow mb-1.5 block">Title</label>
            <input id="film-title" data-autofocus className="field" maxLength={60} value={form.title} onChange={set('title')} placeholder="The movie we keep talking about" />
          </div>
          <div>
            <label htmlFor="film-tag" className="eyebrow mb-1.5 block">Tagline <span className="text-faint">(optional)</span></label>
            <input id="film-tag" className="field" maxLength={120} value={form.tagline} onChange={set('tagline')} placeholder="One night. Two screens. Zero spoilers." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="film-genre" className="eyebrow mb-1.5 block">Genre</label>
              <select id="film-genre" className="field" value={form.genre} onChange={set('genre')}>
                {GENRES.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="film-when" className="eyebrow mb-1.5 block">Showtime <span className="text-faint">(optional)</span></label>
              <input id="film-when" type="datetime-local" className="field" value={form.when} onChange={set('when')} />
            </div>
          </div>
          <fieldset>
            <legend className="eyebrow mb-1.5 block">How we’ll watch it</legend>
            <div className="grid gap-2">
              {[
                { kind: 'stream', icon: MonitorPlay, title: 'I’ll stream it', note: `From a file on your computer. ${w.Subject} ${w.v('sees', 'see')} exactly what you play.` },
                { kind: 'youtube', icon: TvMinimalPlay, title: 'YouTube', note: 'Both play the same video, kept in sync.' },
                { kind: 'link', icon: Link2, title: 'Video link', note: 'A direct https://… .mp4 link.' },
              ].map((o) => (
                <button key={o.kind} type="button" onClick={() => setForm((f) => ({ ...f, kind: o.kind }))} aria-pressed={form.kind === o.kind} className={cn('flex items-start gap-3 rounded-2xl border px-3 py-2.5 text-left transition', form.kind === o.kind ? 'border-peach/70 bg-peach/10' : 'border-line hover:border-line-strong')}>
                  <o.icon className="mt-0.5 h-5 w-5 shrink-0 text-peach" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-sm text-cream">{o.title}</span>
                    <span className="block text-xs text-muted">{o.note}</span>
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
          {form.kind !== 'stream' && (
            <div>
              <label htmlFor="film-link" className="eyebrow mb-1.5 block">{form.kind === 'youtube' ? 'YouTube link' : 'Video link'}</label>
              <input id="film-link" className="field" value={form.link} onChange={set('link')} placeholder={form.kind === 'youtube' ? 'https://youtu.be/…' : 'https://…/film.mp4'} />
            </div>
          )}
          {form.kind === 'stream' && <p className="rounded-xl bg-surface-2 p-3 text-xs text-muted">You’ll choose the file when you’re in your seat. It never gets uploaded: it streams straight from your computer to {w.them}. Use Chrome or Edge on a laptop to stream.</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={busy}>
              Put it on the marquee
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function FilmSheet({ film, onClose }) {
  const me = usePeopleStore((s) => s.me);
  const ticket = useCinemaStore((s) => (film ? s.tickets.find((t) => t.showingKey === film.key) : null));
  const theirSeat = useCinemaStore((s) => (film ? s.partnerSeats[film.key] : null));
  const getTicket = useCinemaStore((s) => s.getTicket);
  const removeShowing = useCinemaStore((s) => s.removeShowing);
  const [printing, setPrinting] = useState(false);
  const [fresh, setFresh] = useState(false);
  const w = usePartnerWords();
  const navigate = useNavigate();
  useEffect(() => setFresh(false), [film?.key]);
  if (!film) return <Modal open={false} onClose={onClose} />;

  const buy = async () => {
    setPrinting(true);
    try {
      await getTicket(film.key, me?.id);
      setFresh(true);
      playSfx('success');
    } catch (e) {
      toast(e.message || 'The box office is closed for a second — try again?', { emoji: '🎟️', tone: 'error' });
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Modal open={!!film} onClose={onClose} title={film.title} className="sm:max-w-2xl">
      <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
        <Poster film={film} className="mx-auto w-40 sm:w-full" />
        <div className="flex min-w-0 flex-col">
          {film.tagline && <p className="font-display text-lg italic text-cream-dim">{film.tagline}</p>}
          <p className="mt-2 text-sm text-muted">{sourceLabel(film, me?.id, w)}</p>
          {film.startsAt && <p className="mt-1 text-sm text-lamp">Showtime: {new Date(film.startsAt).toLocaleString([], { weekday: 'long', hour: 'numeric', minute: '2-digit' })}</p>}
          {film.license && <p className="mt-1 text-xs text-faint">{film.license}</p>}
          {theirSeat && <p className="mt-2 text-sm text-sage">{w.Subject} {w.v('has', 'have')} a ticket: seat {theirSeat} 🎟️</p>}

          <div className="relative mt-5 flex-1">
            {/* the ticket slot */}
            <div className="h-2 rounded-full bg-black/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]" aria-hidden />
            <div className="-mt-1 overflow-hidden pt-1">
              <AnimatePresence>
                {ticket && (
                  <motion.div initial={fresh ? { y: '-105%' } : false} animate={{ y: 0 }} transition={{ duration: 1.4, ease: [0.3, 0.7, 0.3, 1] }}>
                    <TicketCard ticket={ticket} holder={me?.name} compact />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {film.kind !== 'house' && film.hostId === me?.id && (
              <Button
                variant="ghost"
                icon={Trash}
                onClick={async () => {
                  await removeShowing(film.key).catch((e) => toast(e.message, { tone: 'error' }));
                  onClose();
                }}
              >
                Take it down
              </Button>
            )}
            {ticket ? (
              <Button variant="primary" onClick={() => navigate(`/together/movie/${encodeURIComponent(film.key)}`)}>
                Go to Screen 1 <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="primary" icon={Ticket} loading={printing} onClick={buy}>
                Get my ticket
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function NowShowing() {
  const load = useCinemaStore((s) => s.load);
  const showings = useCinemaStore((s) => s.showings);
  const tickets = useCinemaStore((s) => s.tickets);
  const films = useCinemaStore((s) => s.films);
  const me = usePeopleStore((s) => s.me);
  const w = usePartnerWords();
  const [adding, setAdding] = useState(false);
  const [params, setParams] = useSearchParams();
  const openKey = params.get('film');
  const list = films();
  const open = list.find((f) => f.key === openKey) ?? null;
  useEffect(() => {
    load();
  }, [load]);
  void showings;

  return (
    <div className="pb-6">
      <Marquee />
      <p className="mx-auto mt-4 max-w-md text-center text-sm text-muted">Pick a film, grab a ticket, and meet {w.them} inside. The film plays for both of you at the same moment.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((film, i) => {
          const mine = tickets.find((t) => t.showingKey === film.key);
          return (
            <motion.button
              key={film.key}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              onClick={() => setParams({ film: film.key })}
              className="group text-left"
            >
              <div className="relative">
                <Poster film={film} className="shadow-[0_18px_40px_-20px_rgba(0,0,0,0.9)] ring-1 ring-line transition group-hover:ring-lamp/50" />
                {mine && <span className="absolute right-2 top-2 rounded-full bg-[#f7efe2] px-2 py-0.5 text-[11px] font-semibold text-ink shadow">🎟️ {mine.seat}</span>}
              </div>
              <p className="mt-2 truncate text-sm text-cream">{film.title}</p>
              <p className="truncate text-xs text-muted">{sourceLabel(film, me?.id, w)}</p>
            </motion.button>
          );
        })}
        <button type="button" onClick={() => setAdding(true)} className="flex aspect-[2/3] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line text-muted transition hover:border-lamp/50 hover:text-cream">
          <Plus className="h-7 w-7" aria-hidden />
          <span className="text-sm">Put a film on</span>
          <span className="px-4 text-center text-xs text-faint">Stream one from your computer, or use a YouTube link</span>
        </button>
      </div>

      {tickets.length > 0 && (
        <p className="mt-8 text-center text-sm text-muted">
          <Link to="/settings#tickets" className="text-peach hover:underline">
            Your tickets ({tickets.length})
          </Link>
        </p>
      )}

      <AddFilm open={adding} onClose={() => setAdding(false)} />
      <FilmSheet film={open} onClose={() => setParams({})} />
    </div>
  );
}
