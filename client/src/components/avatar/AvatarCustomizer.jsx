import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Check, Shuffle } from 'lucide-react';
import Avatar from './Avatar';
import Tabs from '../ui/Tabs';
import Swatch from '../ui/Swatch';
import {
  SKIN_TONES, HAIR_COLORS, EYE_COLORS, BODY_TYPES, HEIGHTS, FACE_SHAPES, HAIR_STYLES, EYE_STYLES,
  BROW_STYLES, NOSE_STYLES, MOUTH_STYLES, FACE_EXTRAS, CLOTHING, SLOTS, THEMED_OUTFITS,
} from '../../catalog/avatarItems';
import { useWardrobeStore } from '../../stores/wardrobeStore';
import { toast } from '../../stores/uiStore';
import { CoinAmount } from '../wallet/VirtualWallet';
import { cn } from '../../lib/cn';

const TABS = [
  { id: 'body', label: 'Body', emoji: '🧍' },
  { id: 'hair', label: 'Hair', emoji: '💇' },
  { id: 'face', label: 'Face', emoji: '🙂' },
  { id: 'clothing', label: 'Clothing', emoji: '👕' },
  { id: 'accessories', label: 'Accessories', emoji: '💍' },
  { id: 'looks', label: 'Themed looks', emoji: '✨' },
];

const CROP_FOR_SLOT = { top: 'torso', outer: 'torso', dress: 'full', bottom: 'legs', shoes: 'feet', glasses: 'head', hat: 'head', earrings: 'head', necklace: 'torso', watch: 'torso', bag: 'torso' };

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="eyebrow mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Chips({ options, value, onChange, label }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn('rounded-full border px-3.5 py-1.5 text-[13px] transition', value === o.id ? 'border-peach/60 bg-peach/15 text-cream' : 'border-line text-muted hover:border-line-strong hover:text-cream')}
        >
          {o.name}
        </button>
      ))}
    </div>
  );
}

/** A tile that previews the avatar with one option applied. */
const PreviewTile = memo(function PreviewTile({ config, selected, onClick, label, crop = 'head', locked, price, size = 72 }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`${label}${locked ? `, locked, ${price} coins` : ''}`}
      className={cn(
        'relative flex flex-col items-center gap-1 overflow-hidden rounded-2xl border p-2 transition',
        selected ? 'border-peach/60 bg-peach/10' : 'border-line bg-surface-2/50 hover:border-line-strong',
      )}
    >
      <div className={cn('grid place-items-center', locked && 'opacity-60')} style={{ height: size }}>
        <Avatar config={config} crop={crop} size={size} animated={false} label={label} />
      </div>
      <span className="w-full truncate text-center text-[11px] text-cream-dim">{label}</span>
      {selected && (
        <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-peach text-ink">
          <Check className="h-3 w-3" />
        </span>
      )}
      {locked && (
        <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-ink/80 px-1.5 py-0.5 text-[10px] text-lamp">
          <Lock className="h-2.5 w-2.5" />
          {price}
        </span>
      )}
    </motion.button>
  );
});

function Grid({ children }) {
  return <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">{children}</div>;
}

/**
 * Controlled customizer: works on any avatar config. `enforceOwnership`
 * requires locked clothing to be unlocked with Love Coins first.
 */
export default function AvatarCustomizer({ value, onChange, enforceOwnership = true, tabs = TABS.map((t) => t.id), pose = 'idle', expression, aside }) {
  const [tab, setTab] = useState(tabs[0]);
  const [clothingSlot, setClothingSlot] = useState('top');
  const [accSlot, setAccSlot] = useState('glasses');
  const isOwned = useWardrobeStore((s) => s.isOwned);
  const unlocked = useWardrobeStore((s) => s.unlocked); // re-render on unlocks
  const unlock = useWardrobeStore((s) => s.unlock);
  void unlocked;

  const set = (patch) => onChange({ ...value, ...patch });
  const setHair = (patch) => set({ hair: { ...value.hair, ...patch } });
  const setFace = (patch) => set({ face: { ...value.face, ...patch } });

  const equip = (item) => {
    if (enforceOwnership && !isOwned(item.id)) {
      const res = unlock(item.id);
      if (!res.ok) {
        toast(`You need ${item.price} Love Coins for that`, { emoji: '🪙', tone: 'error' });
        return;
      }
      toast(`Unlocked ${item.name}`, { emoji: '✨' });
    }
    const outfit = { ...value.outfit };
    if (outfit[item.slot] === item.id) {
      delete outfit[item.slot];
    } else {
      outfit[item.slot] = item.id;
      if (item.slot === 'dress') {
        delete outfit.top;
        delete outfit.bottom;
      }
      if (item.slot === 'top' || item.slot === 'bottom') delete outfit.dress;
    }
    set({ outfit });
  };

  const randomize = () => {
    const r = (a) => a[Math.floor(Math.random() * a.length)];
    onChange({
      ...value,
      skin: r(SKIN_TONES).color,
      bodyType: r(BODY_TYPES).id,
      faceShape: r(FACE_SHAPES).id,
      hair: { style: r(HAIR_STYLES).id, color: r(HAIR_COLORS).color },
      face: { ...value.face, eyes: r(EYE_STYLES.filter((e) => e.id !== 'happy')).id, eyeColor: r(EYE_COLORS).color, brows: r(BROW_STYLES).id, mouth: r(MOUTH_STYLES.filter((m) => m.id !== 'o')).id },
    });
  };

  const itemsFor = (slot) => CLOTHING.filter((i) => i.slot === slot);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(260px,380px)_1fr]">
      {/* Preview */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="relative flex aspect-[4/5] items-end justify-center overflow-hidden rounded-4xl border border-line bg-[radial-gradient(circle_at_50%_30%,rgba(184,167,217,0.18),transparent_60%),linear-gradient(180deg,#1b1a2b,#141420)] pb-6">
          <div className="absolute inset-x-10 bottom-4 h-10 rounded-full bg-lavender/10 blur-2xl" aria-hidden />
          <motion.div key={JSON.stringify(value.outfit)} initial={{ scale: 0.98 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
            <Avatar config={value} size={340} pose={pose} expression={expression} label="Your avatar preview" />
          </motion.div>
          <button onClick={randomize} className="glass absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-cream-dim hover:text-cream">
            <Shuffle className="h-3.5 w-3.5" aria-hidden /> Surprise me
          </button>
        </div>
        {aside}
      </div>

      {/* Options */}
      <div className="min-w-0">
        <Tabs tabs={TABS.filter((t) => tabs.includes(t.id))} value={tab} onChange={setTab} layoutId="customizer-tabs" className="mb-6" />

        {tab === 'body' && (
          <>
            <Section title="Skin tone">
              <div className="flex flex-wrap gap-2">
                {SKIN_TONES.map((s) => (
                  <Swatch key={s.id} color={s.color} selected={value.skin === s.color} onClick={() => set({ skin: s.color })} label={`Skin tone ${s.id}`} />
                ))}
              </div>
            </Section>
            <Section title="Body type">
              <Chips options={BODY_TYPES} value={value.bodyType} onChange={(bodyType) => set({ bodyType })} label="Body type" />
            </Section>
            <Section title="Height">
              <Chips options={HEIGHTS} value={value.height} onChange={(height) => set({ height })} label="Height" />
            </Section>
            <Section title="Face shape">
              <Grid>
                {FACE_SHAPES.map((f) => (
                  <PreviewTile key={f.id} config={{ ...value, faceShape: f.id, outfit: {} }} selected={value.faceShape === f.id} onClick={() => set({ faceShape: f.id })} label={f.name} />
                ))}
              </Grid>
            </Section>
          </>
        )}

        {tab === 'hair' && (
          <>
            <Section title="Hair colour">
              <div className="flex flex-wrap gap-2">
                {HAIR_COLORS.map((c) => (
                  <Swatch key={c.id} color={c.color} selected={value.hair.color === c.color} onClick={() => setHair({ color: c.color })} label={c.name} />
                ))}
              </div>
            </Section>
            <Section title="Hairstyle">
              <Grid>
                {HAIR_STYLES.map((h) => (
                  <PreviewTile key={h.id} config={{ ...value, hair: { ...value.hair, style: h.id }, outfit: { ...value.outfit, hat: undefined } }} selected={value.hair.style === h.id} onClick={() => setHair({ style: h.id })} label={h.name} />
                ))}
              </Grid>
            </Section>
          </>
        )}

        {tab === 'face' && (
          <>
            <Section title="Eyes">
              <Grid>
                {EYE_STYLES.map((e) => (
                  <PreviewTile key={e.id} config={{ ...value, face: { ...value.face, eyes: e.id } }} selected={value.face.eyes === e.id} onClick={() => setFace({ eyes: e.id })} label={e.name} />
                ))}
              </Grid>
            </Section>
            <Section title="Eye colour">
              <div className="flex flex-wrap gap-2">
                {EYE_COLORS.map((c) => (
                  <Swatch key={c.id} color={c.color} selected={value.face.eyeColor === c.color} onClick={() => setFace({ eyeColor: c.color })} label={`Eye colour ${c.id}`} />
                ))}
              </div>
            </Section>
            <Section title="Eyebrows">
              <Chips options={BROW_STYLES} value={value.face.brows} onChange={(brows) => setFace({ brows })} label="Eyebrows" />
            </Section>
            <Section title="Nose">
              <Chips options={NOSE_STYLES} value={value.face.nose} onChange={(nose) => setFace({ nose })} label="Nose" />
            </Section>
            <Section title="Mouth">
              <Grid>
                {MOUTH_STYLES.map((m) => (
                  <PreviewTile key={m.id} config={{ ...value, face: { ...value.face, mouth: m.id } }} selected={value.face.mouth === m.id} onClick={() => setFace({ mouth: m.id })} label={m.name} />
                ))}
              </Grid>
            </Section>
            <Section title="Little details">
              <Chips options={FACE_EXTRAS} value={value.face.extra} onChange={(extra) => setFace({ extra })} label="Facial details" />
            </Section>
          </>
        )}

        {(tab === 'clothing' || tab === 'accessories') && (
          <>
            <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto" role="tablist" aria-label="Category">
              {Object.entries(SLOTS)
                .filter(([, s]) => s.group === tab)
                .map(([id, s]) => {
                  const active = (tab === 'clothing' ? clothingSlot : accSlot) === id;
                  return (
                    <button
                      key={id}
                      role="tab"
                      aria-selected={active}
                      onClick={() => (tab === 'clothing' ? setClothingSlot(id) : setAccSlot(id))}
                      className={cn('shrink-0 rounded-full px-3.5 py-1.5 text-[13px] transition', active ? 'bg-surface-3 text-cream ring-1 ring-line-strong' : 'text-muted hover:text-cream')}
                    >
                      {s.name}
                    </button>
                  );
                })}
            </div>
            {(() => {
              const slot = tab === 'clothing' ? clothingSlot : accSlot;
              return (
                <Grid>
                  {itemsFor(slot).map((item) => {
                    const worn = value.outfit?.[slot] === item.id;
                    const locked = enforceOwnership && !isOwned(item.id);
                    const preview = { ...value, outfit: { ...value.outfit, [slot]: item.id, ...(slot === 'dress' ? { top: undefined, bottom: undefined } : {}), ...(slot === 'top' || slot === 'bottom' ? { dress: undefined } : {}) } };
                    return (
                      <PreviewTile key={item.id} config={preview} crop={CROP_FOR_SLOT[slot]} selected={worn} locked={locked} price={item.price} onClick={() => equip(item)} label={item.name} />
                    );
                  })}
                </Grid>
              );
            })()}
            <p className="mt-3 text-xs text-muted">Tap something you’re wearing to take it off. Locked pieces unlock with Love Coins.</p>
          </>
        )}

        {tab === 'looks' && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {THEMED_OUTFITS.flatMap((t) =>
              ['feminine', 'masculine'].map((v) => {
                const items = t.variants[v];
                const cost = Object.values(items).reduce((sum, id) => sum + (enforceOwnership && !isOwned(id) ? CLOTHING.find((c) => c.id === id)?.price ?? 0 : 0), 0);
                return (
                  <motion.button
                    key={`${t.id}-${v}`}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      if (cost > 0) {
                        const missing = Object.values(items).filter((id) => !isOwned(id));
                        for (const id of missing) {
                          const res = unlock(id);
                          if (!res.ok) {
                            toast(`That look needs ${cost} Love Coins`, { emoji: '🪙', tone: 'error' });
                            return;
                          }
                        }
                        toast(`Unlocked the ${t.name} look`, { emoji: t.emoji });
                      }
                      onChange({ ...value, outfit: { ...items } });
                    }}
                    className="card flex flex-col items-center p-3 transition hover:border-line-strong"
                  >
                    <Avatar config={{ ...value, outfit: items }} size={150} animated={false} label={`${t.name} look`} />
                    <span className="mt-2 text-sm text-cream">
                      {t.emoji} {t.name}
                    </span>
                    {cost > 0 ? <CoinAmount amount={cost} className="text-xs text-lamp" /> : <span className="text-xs text-muted">Ready to wear</span>}
                  </motion.button>
                );
              }),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
