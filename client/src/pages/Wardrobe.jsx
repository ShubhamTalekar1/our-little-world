import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Save, Sparkles } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button, { ButtonLink } from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import EmptyState from '../components/ui/EmptyState';
import Avatar from '../components/avatar/Avatar';
import OutfitCard from '../components/wardrobe/OutfitCard';
import SaveOutfitModal from '../components/wardrobe/SaveOutfitModal';
import { useAvatarStore, useMyAvatar } from '../stores/avatarStore';
import { useWardrobeStore } from '../stores/wardrobeStore';
import { toast } from '../stores/uiStore';
import { CLOTHING, SLOTS } from '../catalog/avatarItems';
import { cn } from '../lib/cn';

const CROP = { top: 'torso', outer: 'torso', dress: 'full', bottom: 'legs', shoes: 'feet', glasses: 'head', hat: 'head', earrings: 'head', necklace: 'torso', watch: 'torso', bag: 'torso' };
const sameOutfit = (a = {}, b = {}) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((k) => (a[k] ?? null) === (b[k] ?? null));
};

/** One garment tile — tap to wear or take off. */
function ClothingItem({ item, base, worn, onClick, index }) {
  const preview = { ...base, outfit: { ...base.outfit, [item.slot]: item.id, ...(item.slot === 'dress' ? { top: undefined, bottom: undefined } : {}), ...(item.slot === 'top' || item.slot === 'bottom' ? { dress: undefined } : {}) } };
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 16) * 0.02 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      aria-pressed={worn}
      className={cn('card relative flex flex-col items-center gap-1 p-3 text-center transition hover:border-line-strong', worn && 'border-peach/50 bg-peach/[0.06]')}
    >
      <div className="grid h-24 place-items-center">
        <Avatar config={preview} crop={CROP[item.slot]} size={92} animated={false} label={item.name} />
      </div>
      <span className="w-full truncate text-[12.5px] text-cream">{item.name}</span>
      <span className={cn('text-[11px]', worn ? 'text-peach' : 'text-muted')}>{worn ? 'Wearing' : 'Tap to wear'}</span>
      {item.rarity === 'rare' && <Sparkles className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-lavender" aria-label="Rare" />}
    </motion.button>
  );
}

export default function Wardrobe() {
  const avatar = useMyAvatar();
  const equip = useAvatarStore((s) => s.equip);
  const unequip = useAvatarStore((s) => s.unequip);
  const wearOutfit = useAvatarStore((s) => s.wearOutfit);
  const { outfits, saveOutfit, renameOutfit, toggleFavorite, deleteOutfit } = useWardrobeStore();
  const [tab, setTab] = useState('outfits');
  const [slot, setSlot] = useState('all');
  const [saving, setSaving] = useState(false);
  if (!avatar) return null;

  const list = CLOTHING.filter((i) => slot === 'all' || i.slot === slot);
  const sortedOutfits = [...outfits].sort((a, b) => Number(b.favorite) - Number(a.favorite));

  const onItem = (item) => {
    if (avatar.outfit?.[item.slot] === item.id) unequip(item.slot);
    else equip(item.slot, item.id);
  };

  return (
    <div>
      <PageHeader eyebrow="Wardrobe" title="What are we wearing tonight?" subtitle={`${CLOTHING.length} pieces in your closet · ${outfits.length} saved outfits`}>
        <ButtonLink to="/avatar">Edit avatar</ButtonLink>
        <Button variant="primary" icon={Save} onClick={() => setSaving(true)}>
          Save current look
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="card flex flex-col items-center p-5 lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow self-start">Wearing now</p>
          <Avatar config={avatar} size={280} label="Your current outfit" />
          <div className="mt-3 flex flex-wrap justify-center gap-1">
            {Object.entries(avatar.outfit ?? {})
              .filter(([, id]) => id)
              .map(([s, id]) => (
                <button key={s} onClick={() => unequip(s)} className="chip hover:border-rose/40 hover:text-rose" aria-label={`Take off ${CLOTHING.find((c) => c.id === id)?.name}`}>
                  {CLOTHING.find((c) => c.id === id)?.name} ×
                </button>
              ))}
          </div>
        </div>

        <div className="min-w-0">
          <Tabs
            tabs={[
              { id: 'outfits', label: 'Outfits', emoji: '💞', count: outfits.length },
              { id: 'closet', label: 'Closet', emoji: '👚', count: CLOTHING.length },
            ]}
            value={tab}
            onChange={setTab}
            layoutId="wardrobe-tabs"
            className="mb-5"
          />

          {tab === 'outfits' ? (
            outfits.length === 0 ? (
              <EmptyState emoji="👗" title="No saved outfits yet" action={<Button variant="primary" onClick={() => setSaving(true)}>Save what you’re wearing</Button>}>
                Save looks you love so you can change in one tap.
              </EmptyState>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                <AnimatePresence>
                  {sortedOutfits.map((o, i) => (
                    <OutfitCard
                      key={o.id}
                      index={i}
                      outfit={o}
                      base={avatar}
                      worn={sameOutfit(avatar.outfit, o.items)}
                      onWear={() => {
                        wearOutfit(o.items);
                        toast(`Changed into ${o.name}`, { emoji: o.emoji });
                      }}
                      onRename={(name) => renameOutfit(o.id, name)}
                      onFavorite={() => toggleFavorite(o.id)}
                      onDelete={() => {
                        deleteOutfit(o.id);
                        toast(`Removed “${o.name}”`, { emoji: '🧺' });
                      }}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )
          ) : (
            <>
              <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto">
                {[['all', 'Everything'], ...Object.entries(SLOTS).map(([id, s]) => [id, s.name])].map(([id, name]) => (
                  <button key={id} onClick={() => setSlot(id)} aria-pressed={slot === id} className={cn('shrink-0 rounded-full px-3.5 py-1.5 text-[13px] transition', slot === id ? 'bg-surface-3 text-cream ring-1 ring-line-strong' : 'text-muted hover:text-cream')}>
                    {name}
                  </button>
                ))}
              </div>
              {list.length === 0 ? (
                <EmptyState emoji="🧺" title="Nothing here yet">Try another category.</EmptyState>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
                  {list.map((item, i) => (
                    <ClothingItem key={item.id} index={i} item={item} base={avatar} worn={avatar.outfit?.[item.slot] === item.id} onClick={() => onItem(item)} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <SaveOutfitModal
        open={saving}
        onClose={() => setSaving(false)}
        onSave={(name, emoji) => {
          saveOutfit(name, emoji, avatar.outfit);
          setTab('outfits');
          toast(`Saved “${name}”`, { emoji });
        }}
      />
    </div>
  );
}
