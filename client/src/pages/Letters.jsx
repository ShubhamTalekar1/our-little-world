import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PenLine, Lock } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Tabs from '../components/ui/Tabs';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { useLetterStore, isUnlocked } from '../stores/letterStore';
import { usePeopleStore } from '../stores/peopleStore';
import { toast } from '../stores/uiStore';
import { useClock } from '../components/room/effects';
import { countdownParts, formatDate } from '../lib/time';
import { usePartnerWords, wordsFor } from '../lib/words';
import { playSfx } from '../services/audio/sfx';
import { cn } from '../lib/cn';

const SEALS = {
  heart: { emoji: '❤', color: '#9B3B4A' },
  rose: { emoji: '✿', color: '#A34A5C' },
  moon: { emoji: '☾', color: '#4A4A7A' },
  star: { emoji: '✦', color: '#8A6A2A' },
};
const PAPERS = { cream: 'linear-gradient(180deg,#f8f0e3,#efe3d0)', lavender: 'linear-gradient(180deg,#f1ecf8,#e3dbf0)', blush: 'linear-gradient(180deg,#faeee9,#f0dcd4)' };

function Seal({ seal = 'heart', size = 44 }) {
  const s = SEALS[seal] ?? SEALS.heart;
  return (
    <span className="grid place-items-center rounded-full font-display text-[#f5ebdd] shadow-[inset_0_-3px_6px_rgba(0,0,0,0.35),0_3px_8px_rgba(0,0,0,0.4)]" style={{ width: size, height: size, background: `radial-gradient(circle at 35% 30%, ${s.color}dd, ${s.color})`, fontSize: size * 0.42 }} aria-hidden>
      {s.emoji}
    </span>
  );
}

function Envelope({ letter, onOpen, index, mine }) {
  const now = useClock(30_000);
  const unlocked = isUnlocked(letter, now);
  const p = countdownParts(letter.unlockAt, now);
  const opened = !!letter.openedAt;
  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 10) * 0.05 }}
      whileHover={{ y: -4, rotate: index % 2 ? 0.8 : -0.8 }}
      onClick={() => onOpen(letter)}
      className={cn('relative block w-full text-left', !unlocked && !mine && 'cursor-default')}
      aria-label={`${letter.title}${!unlocked ? ', locked' : opened ? ', opened' : ', unopened'}`}
    >
      <div className="relative aspect-[3/2] overflow-hidden rounded-xl shadow-[0_18px_30px_-18px_rgba(0,0,0,0.8)]" style={{ background: 'linear-gradient(160deg,#efe3d0,#dccbb2)' }}>
        <svg viewBox="0 0 300 200" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
          <path d="M0,0 L150,110 L300,0" fill="none" stroke="#c9b596" strokeWidth="2" />
          <path d="M0,200 L120,95 M300,200 L180,95" stroke="#c9b596" strokeWidth="1.5" />
        </svg>
        <div className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2">{opened ? <span className="hand text-2xl text-[#8a6d5a]">opened ♡</span> : <Seal seal={letter.seal} />}</div>
        <p className="hand absolute bottom-3 left-4 right-4 truncate text-xl text-[#5a4a3a]">{letter.title}</p>
        {!unlocked && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#3b3128]/80 px-2 py-0.5 text-[10.5px] text-[#f5ebdd]">
            <Lock className="h-2.5 w-2.5" /> {p.days > 0 ? `${p.days}d ${p.hours}h` : `${p.hours}h ${p.minutes}m`}
          </span>
        )}
        {unlocked && !opened && !mine && <span className="absolute right-3 top-3 animate-pulse rounded-full bg-peach px-2 py-0.5 text-[10.5px] font-semibold text-ink">Open me</span>}
      </div>
    </motion.button>
  );
}

function LetterReader({ letter, onClose }) {
  const markOpened = useLetterStore((s) => s.markOpened);
  const people = usePeopleStore();
  const [stage, setStage] = useState('envelope');
  useEffect(() => {
    if (!letter) return;
    setStage('envelope');
    const t1 = setTimeout(() => setStage('open'), 500);
    const t2 = setTimeout(() => {
      setStage('paper');
      if (!letter.openedAt && letter.from !== people.me?.id) {
        markOpened(letter.id);
        playSfx('open');
      }
    }, 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter?.id]);
  if (!letter) return null;
  const sender = letter.from === people.me?.id ? people.me : people.partner;
  const fromMe = letter.from === people.me?.id;
  return (
    <Modal open={!!letter} onClose={onClose} className="bg-transparent sm:max-w-xl" dim="bg-ink/85" labelledBy="letter-title">
      <div className="relative flex min-h-[420px] items-center justify-center">
        <AnimatePresence mode="wait">
          {stage !== 'paper' ? (
            <motion.div key="env" exit={{ opacity: 0, y: 30, scale: 0.9 }} className="relative w-72" style={{ perspective: 800 }}>
              <div className="relative aspect-[3/2] rounded-xl" style={{ background: 'linear-gradient(160deg,#efe3d0,#dccbb2)' }}>
                <motion.div className="absolute inset-x-0 top-0 h-1/2 origin-top" style={{ background: 'linear-gradient(180deg,#e6d6bd,#d6c3a6)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} animate={stage === 'open' ? { rotateX: 180 } : { rotateX: 0 }} transition={{ duration: 0.6 }} />
                <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" animate={stage === 'open' ? { scale: 0, opacity: 0 } : {}}>
                  <Seal seal={letter.seal} size={52} />
                </motion.div>
                {stage === 'open' && <motion.div className="absolute inset-x-6 bottom-4 h-3/4 rounded-md" style={{ background: PAPERS[letter.paper] ?? PAPERS.cream }} initial={{ y: 0 }} animate={{ y: -90 }} transition={{ duration: 0.8 }} />}
              </div>
            </motion.div>
          ) : (
            <motion.article key="paper" initial={{ opacity: 0, y: 40, scaleY: 0.6 }} animate={{ opacity: 1, y: 0, scaleY: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 16 }} className="relative max-h-[75dvh] w-full origin-top overflow-y-auto rounded-md px-7 py-8 text-[#3b3128] shadow-soft sm:px-10" style={{ background: PAPERS[letter.paper] ?? PAPERS.cream }}>
              <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 31px, rgba(120,100,80,0.14) 31px 32px)', backgroundPosition: '0 70px' }} aria-hidden />
              <div className="relative">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#8a7d6d]">{formatDate(letter.at, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <h2 id="letter-title" className="hand mt-2 text-4xl leading-tight">{letter.title}</h2>
                <div className="hand mt-4 whitespace-pre-wrap text-[23px] leading-[32px]">{letter.body}</div>
                <p className="hand mt-6 text-right text-2xl">— {fromMe ? 'you' : wordsFor(sender).name}</p>
                <div className="mt-2 flex justify-end">
                  <Seal seal={letter.seal} size={36} />
                </div>
              </div>
            </motion.article>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}

function nextAnniversary(since) {
  if (!since) return null;
  const s = new Date(since);
  const now = new Date();
  const d = new Date(now.getFullYear(), s.getMonth(), s.getDate(), 9, 0, 0);
  if (d <= now) d.setFullYear(d.getFullYear() + 1);
  return d;
}

function Composer({ open, onClose }) {
  const me = usePeopleStore((s) => s.me);
  const couple = usePeopleStore((s) => s.couple);
  const write = useLetterStore((s) => s.write);
  const w = usePartnerWords();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [seal, setSeal] = useState('heart');
  const [paper, setPaper] = useState('cream');
  const [when, setWhen] = useState('now');
  const [custom, setCustom] = useState('');
  const options = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(7, 0, 0, 0);
    const anniv = nextAnniversary(couple?.anniversary ?? couple?.since);
    return [
      { id: 'now', label: 'Right away', at: new Date() },
      { id: 'tomorrow', label: 'Tomorrow morning ☀️', at: tomorrow, title: 'Open this tomorrow morning ☀️' },
      ...(anniv ? [{ id: 'anniv', label: 'On our anniversary ❤️', at: anniv, title: 'Open this on our anniversary ❤️' }] : []),
      { id: 'custom', label: 'Pick a date…' },
    ];
  }, [couple]);

  const send = () => {
    if (!body.trim()) return toast('Write a few words first', { emoji: '✍️' });
    const opt = options.find((o) => o.id === when);
    const unlockAt = when === 'custom' ? (custom ? new Date(custom) : new Date()) : opt.at;
    write({ title: title || opt.title || `For ${w.name}`, body, seal, paper, unlockAt: unlockAt.toISOString() }, me.id);
    playSfx('success');
    toast(when === 'now' ? 'Letter delivered 💌' : `Sealed until ${unlockAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} 💌`, { emoji: '✉️' });
    setTitle('');
    setBody('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`A letter for ${w.them}`} className="sm:max-w-2xl">
      <div className="rounded-md p-5 shadow-inner sm:p-7" style={{ background: PAPERS[paper] }}>
        <label htmlFor="letter-t" className="sr-only">Title</label>
        <input id="letter-t" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="Dear you," className="hand w-full bg-transparent text-3xl text-[#3b3128] placeholder:text-[#a8998a] focus:outline-none" />
        <label htmlFor="letter-b" className="sr-only">Letter</label>
        <textarea
          id="letter-b"
          data-autofocus
          value={body}
          maxLength={8000}
          onChange={(e) => setBody(e.target.value)}
          rows={9}
          placeholder="Write it like no one else will ever read it…"
          className="hand mt-2 w-full resize-none bg-transparent text-[22px] leading-[32px] text-[#3b3128] placeholder:text-[#a8998a] focus:outline-none"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 31px, rgba(120,100,80,0.18) 31px 32px)', backgroundAttachment: 'local' }}
        />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="eyebrow mb-2">When can {w.they} open it?</p>
          <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Unlock time">
            {options.map((o) => (
              <button key={o.id} role="radio" aria-checked={when === o.id} onClick={() => setWhen(o.id)} className={cn('rounded-xl px-3 py-2 text-left text-sm transition', when === o.id ? 'bg-peach/15 text-cream ring-1 ring-peach/50' : 'text-muted hover:bg-surface-3 hover:text-cream')}>
                {o.label}
              </button>
            ))}
            {when === 'custom' && (
              <>
                <label htmlFor="letter-when" className="sr-only">Unlock date</label>
                <input id="letter-when" type="datetime-local" className="field" value={custom} onChange={(e) => setCustom(e.target.value)} />
              </>
            )}
          </div>
        </div>
        <div>
          <p className="eyebrow mb-2">Wax seal</p>
          <div className="flex gap-2" role="radiogroup" aria-label="Seal">
            {Object.keys(SEALS).map((s) => (
              <button key={s} role="radio" aria-checked={seal === s} aria-label={`${s} seal`} onClick={() => setSeal(s)} className={cn('rounded-full p-1 transition', seal === s ? 'ring-2 ring-peach' : 'opacity-70 hover:opacity-100')}>
                <Seal seal={s} size={36} />
              </button>
            ))}
          </div>
          <p className="eyebrow mb-2 mt-4">Paper</p>
          <div className="flex gap-2" role="radiogroup" aria-label="Paper">
            {Object.entries(PAPERS).map(([id, bg]) => (
              <button key={id} role="radio" aria-checked={paper === id} aria-label={`${id} paper`} onClick={() => setPaper(id)} className={cn('h-9 w-9 rounded-lg transition', paper === id ? 'ring-2 ring-peach' : 'ring-1 ring-line')} style={{ background: bg }} />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Keep writing later</Button>
        <Button variant="primary" onClick={send}>
          Seal & send 💌
        </Button>
      </div>
    </Modal>
  );
}

export default function Letters() {
  const letters = useLetterStore((s) => s.letters);
  const me = usePeopleStore((s) => s.me);
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState('for-me');
  const [reading, setReading] = useState(null);
  const writing = params.get('write') === '1';
  const w = usePartnerWords();
  const forMe = letters.filter((l) => l.from !== me?.id);
  const fromMe = letters.filter((l) => l.from === me?.id);
  const list = tab === 'for-me' ? forMe : fromMe;

  const open = (l) => {
    if (!isUnlocked(l) && l.from !== me?.id) {
      const p = countdownParts(l.unlockAt);
      toast(`Not yet — ${p.days > 0 ? `${p.days} days` : `${p.hours}h ${p.minutes}m`} to go`, { emoji: '🔒' });
      return;
    }
    setReading(l);
  };

  return (
    <div>
      <PageHeader eyebrow="Letters" title="Words for later" subtitle="Real letters, sealed until the right moment.">
        <Button variant="primary" icon={PenLine} onClick={() => setParams({ write: '1' })}>
          Write a letter
        </Button>
      </PageHeader>
      <Tabs tabs={[{ id: 'for-me', label: `From ${w.them}`, count: forMe.length }, { id: 'from-me', label: 'From you', count: fromMe.length }]} value={tab} onChange={setTab} layoutId="letter-tabs" className="mb-6" />
      {list.length === 0 ? (
        <EmptyState emoji="💌" title={tab === 'for-me' ? 'No letters yet' : 'You haven’t written one yet'} action={tab === 'from-me' && <Button variant="primary" onClick={() => setParams({ write: '1' })}>Write the first</Button>}>
          {tab === 'for-me' ? `When ${w.they} ${w.plural ? 'write' : 'writes'} you something, it’ll arrive here.` : 'A letter to open tomorrow morning is a lovely place to start.'}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((l, i) => (
            <Envelope key={l.id} letter={l} index={i} onOpen={open} mine={l.from === me?.id} />
          ))}
        </div>
      )}
      <LetterReader letter={reading} onClose={() => setReading(null)} />
      <Composer open={writing} onClose={() => setParams({})} />
    </div>
  );
}
