import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Trash, Bell } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Countdown from '../components/calendar/Countdown';
import DailyCheckin from '../components/calendar/DailyCheckin';
import { useCalendarStore, EVENT_TYPES } from '../stores/calendarStore';
import { useCheckinStore } from '../stores/checkinStore';
import { usePeopleStore } from '../stores/peopleStore';
import { toast } from '../stores/uiStore';
import { MOODS_BY_ID } from '../catalog/moods';
import { dayLabel, formatTime, isSameDay } from '../lib/time';
import { usePartnerWords } from '../lib/words';
import { cn } from '../lib/cn';

const pad = (n) => String(n).padStart(2, '0');
const toLocalInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

function EventModal({ open, onClose, initialDate }) {
  const addEvent = useCalendarStore((s) => s.addEvent);
  const [type, setType] = useState('date');
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState('');
  const [reminder, setReminder] = useState(15);
  const [note, setNote] = useState('');
  const seed = () => {
    const d = new Date(initialDate ?? Date.now());
    d.setHours(21, 0, 0, 0);
    return toLocalInput(d);
  };
  const t = EVENT_TYPES.find((e) => e.id === type);
  const save = (e) => {
    e.preventDefault();
    const at = new Date(when || seed());
    if (Number.isNaN(at.getTime())) return;
    addEvent({ title: title || t.label, emoji: t.emoji, type, at: at.toISOString(), reminder: Number(reminder), note });
    toast(`${title || t.label} is on the calendar`, { emoji: t.emoji });
    setTitle('');
    setNote('');
    setWhen('');
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Make a plan">
      <form onSubmit={save} className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Kind of plan">
          {EVENT_TYPES.map((e) => (
            <button type="button" key={e.id} role="radio" aria-checked={type === e.id} onClick={() => setType(e.id)} className={cn('rounded-full border px-3 py-1.5 text-[13px]', type === e.id ? 'border-peach/60 bg-peach/15 text-cream' : 'border-line text-muted hover:text-cream')}>
              {e.emoji} {e.label}
            </button>
          ))}
        </div>
        <div>
          <label htmlFor="ev-title" className="eyebrow mb-1.5 block">What</label>
          <input id="ev-title" data-autofocus className="field" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder={t.label} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ev-when" className="eyebrow mb-1.5 block">When</label>
            <input id="ev-when" type="datetime-local" className="field" value={when || seed()} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div>
            <label htmlFor="ev-rem" className="eyebrow mb-1.5 block">Remind us</label>
            <select id="ev-rem" className="field" value={reminder} onChange={(e) => setReminder(e.target.value)}>
              <option value={5}>5 minutes before</option>
              <option value={15}>15 minutes before</option>
              <option value={60}>1 hour before</option>
              <option value={1440}>A day before</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="ev-note" className="eyebrow mb-1.5 block">A little note</label>
          <input id="ev-note" className="field" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder="Bring (imaginary) popcorn" />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Add to our calendar</Button>
        </div>
      </form>
    </Modal>
  );
}

function CountdownModal({ open, onClose }) {
  const add = useCalendarStore((s) => s.addCountdown);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [emoji, setEmoji] = useState('✈️');
  const [accent, setAccent] = useState('peach');
  const save = (e) => {
    e.preventDefault();
    if (!title.trim() || !target) return;
    add({ title, target: new Date(target).toISOString(), emoji, accent });
    toast('Countdown started', { emoji });
    setTitle('');
    setTarget('');
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Count down to something">
      <form onSubmit={save} className="flex flex-col gap-4">
        <div>
          <label htmlFor="cd-title" className="eyebrow mb-1.5 block">Until…</label>
          <input id="cd-title" data-autofocus className="field" maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Until we see each other" />
        </div>
        <div>
          <label htmlFor="cd-when" className="eyebrow mb-1.5 block">When</label>
          <input id="cd-when" type="datetime-local" className="field" value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {['✈️', '🌙', '🎂', '💞', '🏡', '🎄', '🌅', '🎟️'].map((e) => (
            <button type="button" key={e} onClick={() => setEmoji(e)} aria-pressed={emoji === e} className={cn('grid h-9 w-9 place-items-center rounded-xl text-lg', emoji === e ? 'bg-peach/20 ring-1 ring-peach/50' : 'bg-surface-3/60')}>
              {e}
            </button>
          ))}
          <span className="mx-2 h-6 w-px bg-line" />
          {['peach', 'lavender', 'lamp', 'sage'].map((a) => (
            <button type="button" key={a} onClick={() => setAccent(a)} aria-label={`${a} colour`} aria-pressed={accent === a} className={cn('h-7 w-7 rounded-full', accent === a && 'ring-2 ring-cream ring-offset-2 ring-offset-surface')} style={{ background: `var(--color-${a})` }} />
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={!title.trim() || !target}>Start counting</Button>
        </div>
      </form>
    </Modal>
  );
}

function MonthGrid({ month, setMonth, events, selected, onSelect }) {
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - ((first.getDay() + 6) % 7)); // Monday first
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [month]);
  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl text-cream">{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
        <div className="flex gap-1">
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-lg p-2 text-muted hover:bg-surface-3 hover:text-cream" aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-lg p-2 text-muted hover:bg-surface-3 hover:text-cream" aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10.5px] uppercase tracking-wider text-faint" aria-hidden>
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <span key={d} className="pb-2">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Calendar">
        {days.map((d) => {
          const inMonth = d.getMonth() === month.getMonth();
          const today = isSameDay(d, Date.now());
          const evs = events.filter((e) => isSameDay(e.at, d));
          const sel = selected && isSameDay(selected, d);
          return (
            <button
              key={d.toISOString()}
              role="gridcell"
              aria-selected={!!sel}
              aria-label={`${d.toDateString()}${evs.length ? `, ${evs.map((e) => e.title).join(', ')}` : ''}`}
              onClick={() => onSelect(d)}
              className={cn('relative flex aspect-square flex-col items-center justify-start rounded-xl pt-1.5 text-sm transition sm:aspect-[1.1]', inMonth ? 'text-cream-dim' : 'text-faint/60', sel ? 'bg-peach/15 ring-1 ring-peach/50' : 'hover:bg-surface-3', today && !sel && 'ring-1 ring-lavender/50')}
            >
              <span className={cn(today && 'font-semibold text-lavender')}>{d.getDate()}</span>
              <span className="mt-0.5 flex flex-wrap justify-center gap-0.5 text-[11px] leading-none">
                {evs.slice(0, 2).map((e) => (
                  <span key={e.id} aria-hidden>{e.emoji}</span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MoodWeek() {
  const checkins = useCheckinStore((s) => s.checkins);
  const me = usePeopleStore((s) => s.me);
  const partner = usePeopleStore((s) => s.partner);
  const w = usePartnerWords();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const row = (userId, label) => (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-xs text-muted">{label}</span>
      <div className="grid flex-1 grid-cols-7 gap-1">
        {days.map((d) => {
          const c = checkins.find((x) => x.userId === userId && isSameDay(x.at, d));
          return (
            <span key={d.toISOString()} className="grid aspect-square place-items-center rounded-lg bg-surface-2/70 text-base" title={c ? `${MOODS_BY_ID[c.mood]?.label}${c.note ? ` — ${c.note}` : ''}` : 'No check-in'}>
              {c ? MOODS_BY_ID[c.mood]?.emoji : <span className="h-1 w-1 rounded-full bg-faint/50" />}
            </span>
          );
        })}
      </div>
    </div>
  );
  return (
    <section className="card p-5" aria-label="This week">
      <p className="eyebrow mb-3">This week, gently</p>
      <div className="flex flex-col gap-2">
        {row(partner?.id, w.name)}
        {row(me?.id, 'You')}
      </div>
    </section>
  );
}

export default function Dates() {
  const { events, countdowns, removeEvent, removeCountdown, togglePin } = useCalendarStore();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addingCd, setAddingCd] = useState(false);
  const upcoming = [...events].filter((e) => new Date(e.at) > Date.now() - 3600_000).sort((a, b) => new Date(a.at) - new Date(b.at));
  const shown = selected ? events.filter((e) => isSameDay(e.at, selected)) : upcoming.slice(0, 8);

  return (
    <div>
      <PageHeader eyebrow="Dates" title="Our calendar" subtitle="Plans, reminders and the days we’re counting down to.">
        <Button icon={Plus} onClick={() => setAddingCd(true)}>Countdown</Button>
        <Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>Make a plan</Button>
      </PageHeader>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {countdowns.map((c) => (
          <Countdown key={c.id} countdown={c} onRemove={() => removeCountdown(c.id)} onTogglePin={() => togglePin(c.id)} />
        ))}
        <button onClick={() => setAddingCd(true)} className="grid min-h-32 place-items-center rounded-3xl border border-dashed border-line text-sm text-muted transition hover:border-line-strong hover:text-cream">
          + Count down to something
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <MonthGrid month={month} setMonth={setMonth} events={events} selected={selected} onSelect={(d) => setSelected(selected && isSameDay(selected, d) ? null : d)} />
          <section aria-labelledby="upcoming">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="upcoming" className="eyebrow">{selected ? dayLabel(selected.toISOString()) : 'Coming up'}</h2>
              {selected && (
                <button onClick={() => setAdding(true)} className="text-xs text-peach hover:underline">
                  + Plan something this day
                </button>
              )}
            </div>
            {shown.length === 0 ? (
              <EmptyState emoji="🗓️" title="Nothing planned" action={<Button variant="primary" onClick={() => setAdding(true)}>Make a plan</Button>}>
                An evening call counts. So does a movie.
              </EmptyState>
            ) : (
              <ul className="flex flex-col gap-2">
                {shown.map((e, i) => (
                  <motion.li key={e.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="card group flex items-center gap-4 p-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface-3 text-2xl" aria-hidden>
                      {e.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{dayLabel(e.at)}</p>
                      <p className="text-cream">
                        {formatTime(e.at)} — {e.title}
                      </p>
                      {e.note && <p className="truncate text-xs text-muted">{e.note}</p>}
                    </div>
                    <span className="hidden items-center gap-1 text-[11px] text-faint sm:flex" title="Reminder">
                      <Bell className="h-3 w-3" aria-hidden /> {e.reminder >= 1440 ? '1 day' : e.reminder >= 60 ? `${e.reminder / 60}h` : `${e.reminder}m`}
                    </span>
                    <button
                      onClick={() => {
                        removeEvent(e.id);
                        toast('Plan removed', { emoji: '🗑️' });
                      }}
                      className="rounded-lg p-2 text-faint opacity-100 hover:text-rose sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                      aria-label={`Remove ${e.title}`}
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </motion.li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <aside className="flex flex-col gap-4">
          <DailyCheckin />
          <MoodWeek />
        </aside>
      </div>
      <EventModal open={adding} onClose={() => setAdding(false)} initialDate={selected} />
      <CountdownModal open={addingCd} onClose={() => setAddingCd(false)} />
    </div>
  );
}
