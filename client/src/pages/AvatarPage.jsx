import { useState } from 'react';
import { Shirt, Save } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button, { ButtonLink } from '../components/ui/Button';
import AvatarCustomizer from '../components/avatar/AvatarCustomizer';
import SaveOutfitModal from '../components/wardrobe/SaveOutfitModal';
import { useAvatarStore, useMyAvatar } from '../stores/avatarStore';
import { useWardrobeStore } from '../stores/wardrobeStore';
import { toast } from '../stores/uiStore';
import { usePartnerWords } from '../lib/words';

const POSES = [
  { id: 'idle', label: 'Stand', emoji: '🧍' },
  { id: 'wave', label: 'Wave', emoji: '👋' },
  { id: 'heart', label: 'Love', emoji: '🙌' },
  { id: 'dance', label: 'Sway', emoji: '💃' },
];

export default function AvatarPage() {
  const avatar = useMyAvatar();
  const update = useAvatarStore((s) => s.updateMine);
  const saveOutfit = useWardrobeStore((s) => s.saveOutfit);
  const [pose, setPose] = useState('idle');
  const [saving, setSaving] = useState(false);
  const w = usePartnerWords();
  if (!avatar) return null;
  return (
    <div>
      <PageHeader eyebrow="Avatar" title="Create yourself" subtitle={`Every change shows up for ${w.them} right away.`}>
        <ButtonLink to="/wardrobe" icon={Shirt}>
          Wardrobe
        </ButtonLink>
        <Button variant="primary" icon={Save} onClick={() => setSaving(true)}>
          Save as outfit
        </Button>
      </PageHeader>
      <AvatarCustomizer
        value={avatar}
        onChange={update}
        pose={pose}
        aside={
          <div className="mt-3 flex justify-center gap-1.5" role="group" aria-label="Try a pose">
            {POSES.map((p) => (
              <button key={p.id} onClick={() => setPose(p.id)} aria-pressed={pose === p.id} className={`rounded-full px-3 py-1.5 text-xs transition ${pose === p.id ? 'bg-surface-3 text-cream ring-1 ring-line-strong' : 'text-muted hover:text-cream'}`}>
                <span aria-hidden>{p.emoji}</span> {p.label}
              </button>
            ))}
          </div>
        }
      />
      <SaveOutfitModal
        open={saving}
        onClose={() => setSaving(false)}
        onSave={(name, emoji) => {
          saveOutfit(name, emoji, avatar.outfit);
          toast(`Saved “${name}”`, { emoji });
        }}
      />
    </div>
  );
}
