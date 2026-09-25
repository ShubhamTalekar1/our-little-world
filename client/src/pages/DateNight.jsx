import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarPlus, Heart } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Room from '../components/room/Room';
import InteractionBar from '../components/interactions/InteractionBar';
import ChatPanel from '../components/chat/ChatPanel';
import MiniPlayer from '../components/music/MiniPlayer';
import { SCENES } from '../components/room/scenes';
import { ENVIRONMENTS, ENV_BY_ID } from '../catalog/environments';
import { DATE_ACTIVITIES, DRESS_CODES, FOOD_DRINK, DURATIONS, DATE_PRESETS } from '../catalog/dateOptions';
import { THEMED_OUTFITS } from '../catalog/avatarItems';
import { SONGS } from '../catalog/songs';
import { useActivityStore } from '../stores/activityStore';
import { useRoomStore } from '../stores/roomStore';
import { useAvatarStore, useMyAvatar } from '../stores/avatarStore';
import { useCalendarStore } from '../stores/calendarStore';
import { useMusicStore } from '../stores/musicStore';
import { useStoryStore } from '../stores/storyStore';
import { usePresenceStore } from '../stores/presenceStore';
import { toast } from '../stores/uiStore';
import { usePartnerWords } from '../lib/words';
import { cn } from '../lib/cn';
import { useClock } from '../components/room/effects';

const label = (list, id) => list.find((x) => x.id === id);

function Chips({ list, value, onChange, name }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={name}>
      {list.map((o) => (
        <button key={o.id} role="radio" aria-checked={value === o.id} onClick={() => onChange(o.id)} className={cn('rounded-full border px-3.5 py-1.5 text-[13px] transition', value === o.id ? 'border-peach/60 bg-peach/15 text-cream' : 'border-line text-muted hover:border-line-strong hover:text-cream')}>
          {o.emoji && <span aria-hidden>{o.emoji} </span>}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function DateNightCard({ plan, onStart, onSchedule, starting }) {
  const env = ENV_BY_ID[plan.env];
  const Scene = SCENES[plan.env];
  const w = usePartnerWords();
  return (
    <div className="card relative overflow-hidden">
      <div className="relative h-40 overflow-hidden">
        <Scene />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />
      </div>
      <div className="relative -mt-10 p-6 pt-0">
        <p className="eyebrow text-lamp">Date night</p>
        <h2 className="mt-1 text-2xl text-cream">“{plan.title || env.name}”</h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {[
            ['Activity', label(DATE_ACTIVITIES, plan.activity)?.label],
            ['Dress code', label(DRESS_CODES, plan.dress)?.label],
            ['Music', SONGS.find((s) => s.id === plan.song)?.title],
            ['Food & drink', label(FOOD_DRINK, plan.food)?.label],
            ['Duration', label(DURATIONS, plan.duration)?.label],
            ['With', w.name],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-faint">{k}</dt>
              <dd className="text-cream-dim">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="primary" size="lg" onClick={onStart} loading={starting}>
            Start Date ❤️
          </Button>
          <Button icon={CalendarPlus} onClick={onSchedule}>
            Plan for later
          </Button>
        </div>
      </div>
    </div>
  );
}

function LiveDate({ plan, onEnd }) {
  const w = usePartnerWords();
  const navigate = useNavigate();
  const partnerActivity = usePresenceStore((s) => s.partner.activity);
  const session = useActivityStore((s) => s.sessions.date);
  const now = useClock(1000);
  const mins = Math.floor((now - (session?.startedAt ?? now)) / 60000);
  const food = label(FOOD_DRINK, plan.food);
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-lamp">Date night · {mins} min together</p>
          <h1 className="text-3xl font-light text-cream">{plan.title || ENV_BY_ID[plan.env].name}</h1>
          <p className="text-sm text-muted">{partnerActivity?.type === 'date' ? `${w.Theyre} here with you ✨` : `Waiting for ${w.them} to arrive…`}</p>
        </div>
        <div className="flex gap-2">
          {plan.activity === 'dance' && (
            <Button variant="primary" onClick={() => navigate('/together/dance')}>
              Dance now 💃
            </Button>
          )}
          {plan.activity === 'movie' && (
            <Button variant="primary" onClick={() => navigate('/together/movie')}>
              Start the movie 🎬
            </Button>
          )}
          <Button variant="ghost" onClick={onEnd}>
            End date
          </Button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <Room environment={plan.env} showFurniture={false} className="aspect-[4/5] rounded-4xl shadow-glow ring-1 ring-line sm:aspect-[16/10]">
            {food && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="absolute bottom-[6%] left-1/2 z-30 flex -translate-x-1/2 gap-2 text-3xl drop-shadow-lg" aria-label={`${food.label} on the table`}>
                <span>{food.emoji}</span>
                <span>{food.emoji}</span>
              </motion.div>
            )}
          </Room>
          <InteractionBar className="relative z-30 -mt-6" />
          <MiniPlayer className="mt-4" />
        </div>
        <aside className="card flex h-[480px] flex-col overflow-hidden lg:h-auto" aria-label="Chat">
          <ChatPanel compact className="flex-1" limit={40} />
        </aside>
      </div>
    </div>
  );
}

export default function DateNight() {
  const avatar = useMyAvatar();
  const [plan, setPlan] = useState({ env: 'rooftop', title: 'Rooftop under the stars', activity: 'dance', dress: 'formal', food: 'wine', song: 's1', duration: 60, when: '' });
  const [starting, setStarting] = useState(false);
  const session = useActivityStore((s) => s.sessions.date);
  const { invite, start, end } = useActivityStore();
  const set = (patch) => setPlan((p) => ({ ...p, ...patch }));
  const w = usePartnerWords();

  const dressUp = () => {
    const theme = THEMED_OUTFITS.find((t) => t.id === label(DRESS_CODES, plan.dress)?.outfit);
    if (!theme || !avatar) return;
    const items = theme.variants[avatar.presentation ?? 'feminine'];
    const wearable = items;
    useAvatarStore.getState().wearOutfit({ ...avatar.outfit, ...wearable, ...(wearable.dress ? { top: undefined, bottom: undefined } : {}) });
  };

  const startDate = () => {
    setStarting(true);
    setTimeout(() => {
      useRoomStore.getState().setEnvironment(plan.env);
      dressUp();
      if (usePresenceStore.getState().partner.status !== 'offline') invite('date', { title: plan.title, env: plan.env });
      start('date', plan);
      useMusicStore.getState().play(plan.song);
      useStoryStore.getState().inc('dates');
      useStoryStore.getState().recordFirst('first-date', '🌃', 'First date night', plan.title);
      setStarting(false);
      toast('Your date has begun ✨', { emoji: ENV_BY_ID[plan.env].emoji });
    }, 700);
  };

  const schedule = () => {
    const when = plan.when ? new Date(plan.when) : new Date(Date.now() + 24 * 3600_000);
    if (!plan.when) when.setHours(21, 0, 0, 0);
    useCalendarStore.getState().addEvent({ title: plan.title || ENV_BY_ID[plan.env].name, emoji: ENV_BY_ID[plan.env].emoji, type: 'date', at: when.toISOString(), reminder: 30, note: `Dress code: ${label(DRESS_CODES, plan.dress)?.label}` });
    toast(`Planned for ${when.toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}`, { emoji: '📅' });
  };

  if (session) {
    return (
      <LiveDate
        plan={session.meta?.env ? { ...plan, ...session.meta } : plan}
        onEnd={() => {
          end('date');
          useMusicStore.getState().pause();
          toast('What a lovely evening 🤍', { emoji: '🌙' });
        }}
      />
    );
  }

  return (
    <div>
      <PageHeader eyebrow="Date night" title="Plan a date" subtitle={`Choose the place, the mood and what to wear. ${w.Subject}’ll get an invitation.`} />

      <section aria-labelledby="where" className="mb-8">
        <h2 id="where" className="eyebrow mb-3">Where</h2>
        <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-7">
          {ENVIRONMENTS.map((e) => {
            const Scene = SCENES[e.id];
            const preset = DATE_PRESETS.find((p) => p.env === e.id);
            const active = plan.env === e.id;
            return (
              <motion.button
                key={e.id}
                whileHover={{ y: -3 }}
                onClick={() => set({ env: e.id, title: preset?.title ?? e.name, ...(preset ? { activity: preset.activity, dress: preset.dress, food: preset.food } : {}) })}
                aria-pressed={active}
                className={cn('relative w-40 shrink-0 snap-start overflow-hidden rounded-2xl text-left ring-1 transition sm:w-auto', active ? 'ring-2 ring-peach' : 'ring-line hover:ring-line-strong')}
              >
                <div className="relative aspect-[4/5]">
                  <Scene />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-transparent" />
                  <span className="absolute bottom-2 left-3 right-2 text-[13px] leading-tight text-cream">
                    {e.emoji} {e.short}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex flex-col gap-6">
          <div>
            <label htmlFor="date-title" className="eyebrow mb-2 block">Call it something</label>
            <input id="date-title" className="field" value={plan.title} maxLength={60} onChange={(e) => set({ title: e.target.value })} />
          </div>
          <div>
            <p className="eyebrow mb-2">Activity</p>
            <Chips list={DATE_ACTIVITIES} value={plan.activity} onChange={(activity) => set({ activity })} name="Activity" />
          </div>
          <div>
            <p className="eyebrow mb-2">Music</p>
            <Chips list={SONGS.slice(0, 6).map((s) => ({ id: s.id, label: s.title }))} value={plan.song} onChange={(song) => set({ song })} name="Music" />
          </div>
          <div>
            <p className="eyebrow mb-2">Dress code</p>
            <Chips list={DRESS_CODES} value={plan.dress} onChange={(dress) => set({ dress })} name="Dress code" />
          </div>
          <div>
            <p className="eyebrow mb-2">Food & drink</p>
            <Chips list={FOOD_DRINK} value={plan.food} onChange={(food) => set({ food })} name="Food and drink" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="eyebrow mb-2">Duration</p>
              <Chips list={DURATIONS} value={plan.duration} onChange={(duration) => set({ duration })} name="Duration" />
            </div>
            <div>
              <label htmlFor="date-when" className="eyebrow mb-2 block">When (for planning ahead)</label>
              <input id="date-when" type="datetime-local" className="field" value={plan.when} onChange={(e) => set({ when: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <AnimatePresence mode="wait">
            <motion.div key={plan.env} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <DateNightCard plan={plan} onStart={startDate} onSchedule={schedule} starting={starting} />
            </motion.div>
          </AnimatePresence>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
            <Heart className="h-3 w-3" aria-hidden /> Starting a date changes the room and puts on your dress code.
          </p>
        </div>
      </div>
    </div>
  );
}
