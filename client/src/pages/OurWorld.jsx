import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Plus } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Tabs from '../components/ui/Tabs';
import Button, { ButtonLink } from '../components/ui/Button';
import Room from '../components/room/Room';
import EnvironmentPicker from '../components/room/EnvironmentPicker';
import PetSprite from '../components/pet/PetSprite';
import { FURNITURE } from '../catalog/furniture';
import { PET_SPECIES, PET_ACCESSORIES, PET_FOODS } from '../catalog/pets';
import { ACHIEVEMENTS } from '../catalog/achievements';
import { useRoomStore } from '../stores/roomStore';
import { usePetStore } from '../stores/petStore';
import { useStoryStore } from '../stores/storyStore';
import { toast } from '../stores/uiStore';
import { useAchievementSnapshot } from '../hooks/useAchievements';
import { playSfx } from '../services/audio/sfx';
import { formatDate, timeAgo } from '../lib/time';
import { usePartnerWords } from '../lib/words';
import { cn } from '../lib/cn';

function Decorate() {
  const { environment, placed, place } = useRoomStore();
  const [decorating, setDecorating] = useState(true);
  const isBedroom = environment === 'bedroom';
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div>
        <Room decorating={decorating && isBedroom} className="aspect-[4/5] rounded-4xl ring-1 ring-line sm:aspect-[16/10]">
          <div className="absolute inset-x-3 top-3 z-40 flex justify-between gap-2">
            <EnvironmentPicker />
            {isBedroom && (
              <button onClick={() => setDecorating((v) => !v)} className={cn('glass rounded-full px-3 py-1.5 text-[13px]', decorating ? 'text-peach' : 'text-cream-dim')} aria-pressed={decorating}>
                {decorating ? 'Done arranging' : 'Arrange'}
              </button>
            )}
          </div>
        </Room>
        <p className="mt-3 text-xs text-muted">
          {isBedroom ? 'Drag things around, or tap one to nudge it with the arrows. Changes appear in both your rooms.' : 'Decorations live in your room — switch back to the rainy window room to arrange them.'}
        </p>
      </div>
      <div>
        <p className="eyebrow mb-3">Furniture & little things</p>
        <ul className="grid grid-cols-2 gap-2">
          {FURNITURE.map((f) => {
            const count = placed.filter((p) => p.id === f.id).length;
            return (
              <li key={f.id}>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    if (f.special && count > 0) return toast('Already twinkling ✨', { emoji: '💡' });
                    place(f.id);
                    if (!isBedroom) toast('Placed in your room', { emoji: f.emoji.length < 3 ? f.emoji : '✨' });
                  }}
                  className="card flex w-full flex-col items-center gap-1 p-3 text-center transition hover:border-line-strong"
                  aria-label={`Place ${f.name}`}
                >
                  <span className="text-3xl" aria-hidden>
                    {f.id === 'lamp' ? '🏮' : f.id === 'fairy' ? '✨' : f.emoji}
                  </span>
                  <span className="text-[12px] text-cream">{f.name}</span>
                  <span className="flex items-center gap-1 text-[11px] text-muted">
                    <Plus className="h-3 w-3" /> place {count > 0 && `· ${count} out`}
                  </span>
                </motion.button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function PetCorner() {
  const { pet, adopt, feed, play, rename, setAccessory } = usePetStore();
  const [species, setSpecies] = useState('cat');
  const [name, setName] = useState('');
  const [bounce, setBounce] = useState(0);
  const [editing, setEditing] = useState(false);
  const w = usePartnerWords();

  if (!pet.adopted) {
    return (
      <div className="card mx-auto max-w-xl p-8 text-center">
        <h2 className="text-2xl text-cream">Raise someone together</h2>
        <p className="mt-1 text-sm text-muted">A little companion who lives in your room and misses you both.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {PET_SPECIES.map((s) => (
            <button key={s.id} onClick={() => setSpecies(s.id)} aria-pressed={species === s.id} className={cn('rounded-3xl p-3 transition', species === s.id ? 'bg-peach/15 ring-1 ring-peach/50' : 'hover:bg-surface-3')}>
              <PetSprite species={s.id} size={80} />
              <span className="block text-xs text-cream-dim">{s.name}</span>
            </button>
          ))}
        </div>
        <label htmlFor="pet-name" className="sr-only">Name</label>
        <input id="pet-name" className="field mx-auto mt-6 max-w-xs text-center" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} placeholder="Name them together…" />
        <Button
          variant="primary"
          className="mt-4"
          onClick={() => {
            adopt(species, name);
            playSfx('gift');
            toast(`Welcome home, ${name || 'Mochi'}`, { emoji: '🐾' });
          }}
        >
          Adopt
        </Button>
      </div>
    );
  }

  const Stat = ({ label, value, color }) => (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
        <motion.div className={cn('h-full rounded-full', color)} animate={{ width: `${value}%` }} />
      </div>
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="card relative flex flex-col items-center overflow-hidden p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,rgba(242,201,139,0.15),transparent_60%)]" aria-hidden />
        <button
          onClick={() => {
            play();
            setBounce((b) => b + 1);
            playSfx('heart');
          }}
          className="relative"
          aria-label={`Play with ${pet.name}`}
        >
          <PetSprite species={pet.species} accessory={pet.accessory} size={220} bounceKey={bounce || undefined} mood={pet.hunger < 25 ? 'sleepy' : 'happy'} label={pet.name} />
          {bounce > 0 && (
            <motion.span key={bounce} className="absolute left-1/2 top-0 text-2xl" initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -60 }} transition={{ duration: 1.2 }} aria-hidden>
              ❤️
            </motion.span>
          )}
        </button>
        {editing ? (
          <form
            className="relative mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              rename(name);
              setEditing(false);
            }}
          >
            <label htmlFor="rename-pet" className="sr-only">New name</label>
            <input id="rename-pet" autoFocus className="field py-2 text-center" defaultValue={pet.name} maxLength={24} onChange={(e) => setName(e.target.value)} />
            <Button type="submit" size="sm" icon={Check} aria-label="Save name" />
          </form>
        ) : (
          <button onClick={() => setEditing(true)} className="relative mt-4 font-display text-3xl text-cream hover:text-peach" aria-label={`Rename ${pet.name}`}>
            {pet.name}
          </button>
        )}
        <p className="relative text-sm text-muted">
          {pet.hunger < 25 ? `${pet.name} is sleepy and a bit hungry` : pet.happiness > 70 ? `${pet.name} is very happy you two are here` : `${pet.name} would love some attention`}
        </p>
        <div className="relative mt-6 grid w-full max-w-sm gap-3">
          <Stat label="Fed" value={pet.hunger} color="bg-lamp" />
          <Stat label="Happy" value={pet.happiness} color="bg-peach" />
        </div>
        <div className="relative mt-6 flex flex-wrap justify-center gap-2">
          {PET_FOODS.map((f) => (
            <Button
              key={f.id}
              size="sm"
              onClick={() => {
                feed(f.id);
                setBounce((b) => b + 1);
                toast(`${pet.name} loved the ${f.name.toLowerCase()}`, { emoji: f.emoji });
              }}
            >
              {f.emoji} {f.name}
            </Button>
          ))}
          <Button
            size="sm"
            variant="lavender"
            onClick={() => {
              play();
              setBounce((b) => b + 1);
            }}
          >
            🧶 Play
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="card p-5">
          <p className="eyebrow mb-3">Dress {pet.name}</p>
          <div className="grid grid-cols-3 gap-2">
            {PET_ACCESSORIES.map((a) => {
              return (
                <button
                  key={a.id}
                  onClick={() => setAccessory(a.id)}
                  aria-pressed={pet.accessory === a.id}
                  className={cn('flex flex-col items-center rounded-2xl p-2 transition', pet.accessory === a.id ? 'bg-peach/15 ring-1 ring-peach/50' : 'bg-surface-2/60 hover:bg-surface-3')}
                >
                  <PetSprite species={pet.species} accessory={a.id} size={56} />
                  <span className="text-[11px] text-cream-dim">{a.name}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="card p-5">
          <p className="eyebrow mb-3">Lately</p>
          <ul className="flex flex-col gap-2 text-sm">
            {(pet.log ?? []).slice(0, 6).map((l, i) => (
              <li key={i} className="flex justify-between gap-2 text-cream-dim">
                <span>{l.text.replace(/^She /, `${w.Subject} `)}</span>
                <span className="shrink-0 text-xs text-faint">{timeAgo(l.at)}</span>
              </li>
            ))}
            {!pet.log?.length && <li className="text-muted">Nothing yet — say hi!</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Keepsakes() {
  const snapshot = useAchievementSnapshot();
  const unlocked = useStoryStore((s) => s.unlocked);
  return (
    <div>
      <p className="mb-5 max-w-lg text-sm text-muted">Not trophies — just little markers of the time you’ve spent together.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ACHIEVEMENTS.map((a, i) => {
          const done = a.check(snapshot);
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={cn('card flex flex-col items-center p-5 text-center', !done && 'opacity-50')}>
              <span className={cn('grid h-16 w-16 place-items-center rounded-full text-3xl', done ? 'bg-gradient-to-br from-lamp/25 to-peach/10 ring-1 ring-lamp/40' : 'bg-surface-3 grayscale')} aria-hidden>
                {a.emoji}
              </span>
              <p className="mt-3 text-sm text-cream">{a.name}</p>
              <p className="mt-0.5 text-xs text-muted">{a.note}</p>
              <p className="mt-2 text-[10.5px] uppercase tracking-wider text-faint">{done ? (unlocked[a.id] ? formatDate(unlocked[a.id], { month: 'short', day: 'numeric' }) : 'Kept') : 'Someday'}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function OurWorld() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'decorate';
  return (
    <div>
      <PageHeader eyebrow="Our world" title="The little place we share" subtitle="Make it yours, look after each other, keep the small things.">
        <ButtonLink to="/story">Our story →</ButtonLink>
      </PageHeader>
      <Tabs
        tabs={[
          { id: 'decorate', label: 'Decorate', emoji: '🛋️' },
          { id: 'pet', label: 'Our pet', emoji: '🐾' },
          { id: 'keepsakes', label: 'Keepsakes', emoji: '✨' },
        ]}
        value={tab}
        onChange={(t) => setParams({ tab: t })}
        layoutId="world-tabs"
        className="mb-6"
      />
      {tab === 'decorate' && <Decorate />}
      {tab === 'pet' && <PetCorner />}
      {tab === 'keepsakes' && <Keepsakes />}
    </div>
  );
}
