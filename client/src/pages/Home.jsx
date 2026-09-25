import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Paintbrush } from 'lucide-react';
import Room from '../components/room/Room';
import EnvironmentPicker from '../components/room/EnvironmentPicker';
import InteractionBar from '../components/interactions/InteractionBar';
import PresenceIndicator from '../components/presence/PresenceIndicator';
import Countdown from '../components/calendar/Countdown';
import DailyCheckin from '../components/calendar/DailyCheckin';
import GiftArt from '../components/gifts/GiftArt';
import PetSprite from '../components/pet/PetSprite';
import { usePeopleStore } from '../stores/peopleStore';
import { useCalendarStore } from '../stores/calendarStore';
import { useMemoryStore } from '../stores/memoryStore';
import { useLetterStore } from '../stores/letterStore';
import { useGiftStore } from '../stores/giftStore';
import { usePetStore } from '../stores/petStore';
import { useStoryStore } from '../stores/storyStore';
import { useUiStore } from '../stores/uiStore';
import { useActivityStore } from '../stores/activityStore';
import { usePresenceStore } from '../stores/presenceStore';
import { GIFTS_BY_ID } from '../catalog/gifts';
import { usePartnerWords } from '../lib/words';
import { dayLabel, formatTime, partOfDay, timeAgo, formatDate } from '../lib/time';

function Greeting() {
  const me = usePeopleStore((s) => s.me);
  const partner = usePeopleStore((s) => s.partner);
  const part = partOfDay();
  const line = { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', night: 'Late night' }[part];
  return (
    <div className="mb-5 text-center">
      <motion.p initial={{ opacity: 0, letterSpacing: '0.5em' }} animate={{ opacity: 1, letterSpacing: '0.32em' }} transition={{ duration: 1.2 }} className="text-[11px] uppercase text-muted">
        Our little world
      </motion.p>
      <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }} className="mt-3 text-4xl font-light text-cream sm:text-5xl">
        {me?.name} <span className="font-normal italic text-peach">&amp;</span> {partner?.name}
      </motion.h1>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-3 flex flex-col items-center gap-1">
        <PresenceIndicator />
        <span className="sr-only">{line}</span>
      </motion.div>
    </div>
  );
}

const TONIGHT = [
  { to: '/together/movie', emoji: '🎬', label: 'Watch Together', invite: 'movie' },
  { to: '/together/dance', emoji: '💃', label: 'Slow Dance', invite: 'dance' },
  { to: '/gifts', emoji: '🎁', label: (w) => `Send ${w.them} something` },
  { to: '/letters?write=1', emoji: '💌', label: 'Write a Letter' },
  { to: '/memories', emoji: '📸', label: 'Look at Memories' },
  { to: '/together/call', emoji: '❤️', label: 'Come sit with me', invite: 'call' },
];

function TonightActions() {
  const w = usePartnerWords();
  const navigate = useNavigate();
  const invite = useActivityStore((s) => s.invite);
  const status = usePresenceStore((s) => s.partner.status);
  return (
    <section aria-labelledby="tonight" className="mt-8">
      <h2 id="tonight" className="hand text-center text-3xl text-cream-dim">
        “What should we do tonight?”
      </h2>
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {TONIGHT.map((a, i) => (
          <motion.button
            key={a.to}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (a.invite && status !== 'offline') invite(a.invite);
              navigate(a.to);
            }}
            className="group flex items-center gap-3 rounded-2xl border border-line bg-surface/70 px-4 py-3.5 text-left transition hover:border-peach/30 hover:bg-surface-2"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-3 text-xl transition group-hover:scale-110" aria-hidden>
              {a.emoji}
            </span>
            <span className="text-[14px] text-cream">{typeof a.label === 'function' ? a.label(w) : a.label}</span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

function TonightsPlan() {
  const events = useCalendarStore((s) => s.events);
  const next = [...events].filter((e) => new Date(e.at) > Date.now() - 3600_000).sort((a, b) => new Date(a.at) - new Date(b.at))[0];
  if (!next) return null;
  return (
    <Link to="/dates" className="card group block p-5 transition hover:border-line-strong">
      <p className="eyebrow">{dayLabel(next.at) === 'Today' ? 'Tonight’s plan' : 'Next up'}</p>
      <p className="mt-2 font-display text-xl text-cream">
        {next.title} <span aria-hidden>{next.emoji}</span>
      </p>
      <p className="text-sm text-muted">
        {dayLabel(next.at)} · {formatTime(next.at)}
      </p>
      {next.note && <p className="hand mt-2 text-xl text-peach">{next.note}</p>}
    </Link>
  );
}

function LatestGift() {
  const g = useGiftStore((s) => s.received[0]);
  const openGift = useUiStore((s) => s.setOpeningGift);
  const w = usePartnerWords();
  if (!g) return null;
  const gift = GIFTS_BY_ID[g.opened ? g.revealed ?? g.giftId : g.giftId];
  return (
    <button onClick={() => openGift(g.id)} className="card flex w-full items-center gap-4 p-4 text-left transition hover:border-line-strong">
      <GiftArt gift={g.opened ? gift : GIFTS_BY_ID.mystery} size={56} />
      <span className="min-w-0">
        <span className="eyebrow block">{g.opened ? 'Last gift' : 'Unopened ✨'}</span>
        <span className="mt-1 block truncate text-sm text-cream">{g.opened ? `${gift.name} from ${w.them}` : `${w.Subject} left you something`}</span>
        <span className="block text-xs text-muted">{timeAgo(g.at)}</span>
      </span>
    </button>
  );
}

function PetCard() {
  const pet = usePetStore((s) => s.pet);
  if (!pet.adopted) return null;
  return (
    <Link to="/world?tab=pet" className="card flex items-center gap-4 p-4 transition hover:border-line-strong">
      <PetSprite species={pet.species} accessory={pet.accessory} size={60} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-cream">{pet.name}</span>
        <span className="mt-1.5 flex items-center gap-2 text-[11px] text-muted">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
            <span className="block h-full rounded-full bg-lamp" style={{ width: `${pet.hunger}%` }} />
          </span>
          fed
        </span>
        <span className="mt-1 flex items-center gap-2 text-[11px] text-muted">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
            <span className="block h-full rounded-full bg-peach" style={{ width: `${pet.happiness}%` }} />
          </span>
          happy
        </span>
      </span>
    </Link>
  );
}

function LastTimeTogether() {
  const milestones = useStoryStore((s) => s.milestones);
  const last = [...milestones].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  if (!last) return null;
  return (
    <Link to="/story" className="card block p-5 transition hover:border-line-strong">
      <p className="eyebrow">Last time together</p>
      <p className="mt-2 text-sm text-cream">
        <span className="mr-1" aria-hidden>{last.emoji}</span>
        {last.title}
      </p>
      <p className="text-xs text-muted">{formatDate(last.date)} · {last.note}</p>
    </Link>
  );
}

/** Gentle suggestions for a brand-new world; each disappears once done. */
function FirstSteps() {
  const memories = useMemoryStore((s) => s.memories.length);
  const countdowns = useCalendarStore((s) => s.countdowns.length);
  const events = useCalendarStore((s) => s.events.length);
  const letters = useLetterStore((s) => s.letters.length);
  const pet = usePetStore((s) => s.pet.adopted);
  const w = usePartnerWords();
  const steps = [
    !memories && { to: '/memories', emoji: '📸', text: 'Pin your first memory' },
    !countdowns && { to: '/dates', emoji: '✈️', text: 'Count down to seeing each other' },
    !events && { to: '/date-night', emoji: '🌃', text: 'Plan your first date night' },
    !letters && { to: '/letters?write=1', emoji: '💌', text: `Write ${w.them} a letter for later` },
    !pet && { to: '/world?tab=pet', emoji: '🐾', text: 'Adopt a little companion' },
  ].filter(Boolean);
  if (!steps.length) return null;
  return (
    <section className="card p-5" aria-labelledby="first-steps">
      <h2 id="first-steps" className="eyebrow">Make it yours</h2>
      <ul className="mt-3 flex flex-col gap-1">
        {steps.map((s) => (
          <li key={s.to}>
            <Link to={s.to} className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-cream-dim transition hover:bg-surface-3 hover:text-cream">
              <span aria-hidden>{s.emoji}</span>
              {s.text}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Home() {
  const all = useCalendarStore((s) => s.countdowns);
  const countdowns = all.filter((c) => c.pinned);
  return (
    <div>
      <Greeting />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <motion.div initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
            <Room className="aspect-[4/5] rounded-4xl shadow-glow ring-1 ring-line sm:aspect-[16/10]">
              <div className="absolute inset-x-3 top-3 z-30 flex items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
                <EnvironmentPicker />
                <Link to="/world?tab=decorate" className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-cream-dim hover:text-cream">
                  <Paintbrush className="h-3.5 w-3.5" aria-hidden /> Decorate
                </Link>
              </div>
            </Room>
          </motion.div>
          <InteractionBar className="-mt-6 relative z-30 px-2" />
          <TonightActions />
        </div>
        <aside className="flex flex-col gap-4" aria-label="Our day">
          <TonightsPlan />
          <FirstSteps />
          {countdowns.slice(0, 2).map((c) => (
            <Countdown key={c.id} countdown={c} compact />
          ))}
          <DailyCheckin />
          <LatestGift />
          <PetCard />
          <LastTimeTogether />
        </aside>
      </div>
    </div>
  );
}
