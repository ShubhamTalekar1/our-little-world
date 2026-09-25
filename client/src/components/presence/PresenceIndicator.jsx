import { usePresenceStore } from '../../stores/presenceStore';
import { usePartnerWords } from '../../lib/words';
import { presenceLabel } from '../../lib/presence';
import { cn } from '../../lib/cn';

const DOT = { online: 'bg-sage', away: 'bg-lamp', offline: 'bg-faint' };

export function PresenceDot({ status, className }) {
  return (
    <span className={cn('relative inline-flex h-2.5 w-2.5', className)} aria-hidden>
      {status === 'online' && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage/60" style={{ animationDuration: '2.4s' }} />}
      <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full ring-2 ring-ink', DOT[status] ?? DOT.offline)} />
    </span>
  );
}

export default function PresenceIndicator({ className }) {
  const presence = usePresenceStore((s) => s.partner);
  const w = usePartnerWords();
  return (
    <span className={cn('inline-flex items-center gap-2 text-sm text-cream-dim', className)} aria-live="polite">
      <PresenceDot status={presence.status} />
      {presenceLabel(presence, w)}
    </span>
  );
}
