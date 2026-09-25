import { Mail, Video } from 'lucide-react';
import ChatPanel from '../components/chat/ChatPanel';
import Avatar from '../components/avatar/Avatar';
import PresenceIndicator from '../components/presence/PresenceIndicator';
import { ButtonLink } from '../components/ui/Button';
import { usePeopleStore } from '../stores/peopleStore';
import { useAvatarStore } from '../stores/avatarStore';
import { usePartnerWords } from '../lib/words';
import { isEnabled, FRIENDS } from '../config/features';

export default function Chat() {
  const partner = usePeopleStore((s) => s.partner);
  const avatar = useAvatarStore((s) => s.avatars[partner?.id]);
  const w = usePartnerWords();
  return (
    <div className="card flex h-[calc(100dvh-17rem)] min-h-[420px] flex-col overflow-hidden lg:h-[calc(100dvh-9rem)]">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
        <span className="rounded-full bg-surface-2 ring-1 ring-line">
          <Avatar config={avatar} crop="head" size={44} flip animated={false} label={w.name} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-lg text-cream">Talk to {w.them}</h1>
          <PresenceIndicator className="truncate text-xs" />
        </div>
        {isEnabled('letters') && (
          <span className="hidden sm:block">
            <ButtonLink to="/letters?write=1" size="sm" icon={Mail}>
              Write a letter
            </ButtonLink>
          </span>
        )}
        {isEnabled('call') && (
          <ButtonLink to="/together/call" size="sm" variant="primary" icon={Video} aria-label="Video call">
            <span className="hidden sm:inline">{FRIENDS ? 'Video call' : 'Come sit with me'}</span>
          </ButtonLink>
        )}
        {isEnabled('movie') && (
          <ButtonLink to="/together/movie" size="sm" variant="primary" aria-label="Movie night">
            🎬 <span className="hidden sm:inline">Movie night</span>
          </ButtonLink>
        )}
      </div>
      <ChatPanel className="flex-1" />
    </div>
  );
}
