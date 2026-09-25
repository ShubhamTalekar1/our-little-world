import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCheck } from 'lucide-react';
import Drawer from '../ui/Drawer';
import EmptyState from '../ui/EmptyState';
import { useNotificationStore } from '../../stores/notificationStore';
import { useUiStore } from '../../stores/uiStore';
import { timeAgo } from '../../lib/time';

const ICON = { gift: '🎁', message: '💬', invite: '💌', presence: '🤍', event: '📅', letter: '✉️', memory: '📸', avatar: '👗', checkin: '🌤️', achievement: '✨' };

export default function NotificationCenter() {
  const open = useUiStore((s) => s.notificationsOpen);
  const setOpen = useUiStore((s) => s.setNotificationsOpen);
  const openGift = useUiStore((s) => s.setOpeningGift);
  const items = useNotificationStore((s) => s.items);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAll = useNotificationStore((s) => s.markAllRead);
  const navigate = useNavigate();

  const onClick = (n) => {
    markRead(n.id);
    setOpen(false);
    if (n.giftId) openGift(n.giftId);
    else if (n.link) navigate(n.link);
  };

  return (
    <Drawer open={open} onClose={() => setOpen(false)} title="Little updates">
      {items.length === 0 ? (
        <div className="p-5">
          <EmptyState emoji="🕊️" title="All quiet">
            When something happens in your world, it’ll land softly here.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="flex justify-end px-4 pt-3">
            <button onClick={markAll} className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted hover:text-cream">
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          </div>
          <ul className="flex flex-col gap-1 p-3">
            {items.map((n, i) => (
              <motion.li key={n.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
                <button onClick={() => onClick(n)} className={`flex w-full items-start gap-3 rounded-2xl p-3 text-left transition hover:bg-surface-3 ${n.read ? 'opacity-70' : 'bg-surface-2/60'}`}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-3 text-lg" aria-hidden>
                    {ICON[n.type] ?? '✨'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-cream">{n.title}</span>
                    {n.body && <span className="block truncate text-xs text-muted">{n.body}</span>}
                    <span className="mt-0.5 block text-[11px] text-faint">{timeAgo(n.at)}</span>
                  </span>
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-peach" aria-label="unread" />}
                </button>
              </motion.li>
            ))}
          </ul>
        </>
      )}
    </Drawer>
  );
}
