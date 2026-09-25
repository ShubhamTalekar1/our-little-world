import { Link, useNavigate } from 'react-router-dom';
import { Bell, Settings } from 'lucide-react';
import Avatar from '../avatar/Avatar';
import IconButton from '../ui/IconButton';
import PresenceIndicator, { PresenceDot } from '../presence/PresenceIndicator';
import { usePeopleStore } from '../../stores/peopleStore';
import { useAvatarStore } from '../../stores/avatarStore';
import { usePresenceStore } from '../../stores/presenceStore';
import { useUnreadCount } from '../../stores/notificationStore';
import { useUiStore } from '../../stores/uiStore';
import { useClock } from '../room/effects';
import { daysBetween } from '../../lib/time';
import { usePartnerWords } from '../../lib/words';
import { FRIENDS } from '../../config/features';

function fmt(date, tz) {
  try {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: tz });
  } catch {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
}

export function CoupleBadge({ size = 38 }) {
  const me = usePeopleStore((s) => s.me);
  const partner = usePeopleStore((s) => s.partner);
  const avatars = useAvatarStore((s) => s.avatars);
  const status = usePresenceStore((s) => s.partner.status);
  return (
    <div className="flex items-center">
      <span className="relative rounded-full bg-surface-2 ring-2 ring-ink" style={{ width: size, height: size }}>
        <Avatar config={avatars[me?.id]} crop="head" size={size} animated={false} label={me?.name} />
      </span>
      <span className="relative -ml-2.5 rounded-full bg-surface-2 ring-2 ring-ink" style={{ width: size, height: size }}>
        <Avatar config={avatars[partner?.id]} crop="head" size={size} flip animated={false} label={partner?.name} />
        <PresenceDot status={status} className="absolute -bottom-0.5 -right-0.5" />
      </span>
    </div>
  );
}

export default function TopBar() {
  const me = usePeopleStore((s) => s.me);
  const partner = usePeopleStore((s) => s.partner);
  const couple = usePeopleStore((s) => s.couple);
  const unread = useUnreadCount();
  const setNotifs = useUiStore((s) => s.setNotificationsOpen);
  const now = useClock(30_000);
  const w = usePartnerWords();
  const navigate = useNavigate();
  const days = couple ? daysBetween(couple.since) : 0;
  const sameZone = !partner?.timezone || partner.timezone === me?.timezone;

  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="Home">
          <CoupleBadge />
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] text-cream">
              {me?.name} <span className="text-peach" aria-label="and">{FRIENDS ? '&' : '❤︎'}</span> {partner?.name}
            </p>
            <p className="truncate text-[11.5px] text-muted">{FRIENDS ? 'Our little world' : `Together for ${days} days`}</p>
          </div>
        </Link>
        <div className="mx-auto hidden md:block">
          <PresenceIndicator />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden text-right text-[11px] leading-tight text-muted sm:block" aria-label="Current times">
            <p>
              you <span className="tabular-nums text-cream-dim">{fmt(now)}</span>
            </p>
            {!sameZone && (
              <p>
                {w.them} <span className="tabular-nums text-cream-dim">{fmt(now, partner.timezone)}</span>
              </p>
            )}
          </div>
          <IconButton icon={Bell} label={`Notifications${unread ? `, ${unread} unread` : ''}`} badge={unread} onClick={() => setNotifs(true)} />
          <span className="hidden sm:block">
            <IconButton icon={Settings} label="Settings" onClick={() => navigate('/settings')} />
          </span>
        </div>
      </div>
      <div className="border-t border-line/40 px-4 py-1.5 text-center md:hidden">
        <PresenceIndicator className="text-xs" />
      </div>
    </header>
  );
}
