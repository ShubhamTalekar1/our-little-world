import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { NAV, NAV_LOCKED } from './nav';
import { useChatStore } from '../../stores/chatStore';
import { useUnopenedGifts } from '../../stores/giftStore';
import { cn } from '../../lib/cn';

export default function Sidebar() {
  const unopened = useUnopenedGifts().length;
  return (
    <nav aria-label="Main" className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col overflow-y-auto border-r border-line bg-night/60 px-4 py-6 backdrop-blur-xl lg:flex">
      <NavLink to="/" className="mb-8 flex items-center gap-2.5 px-2" aria-label="Our little world — home">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-peach/30 to-lavender/30 ring-1 ring-line-strong">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path d="M15.5 4.5a8 8 0 1 0 4 12.3A7 7 0 0 1 15.5 4.5z" fill="#F2C98B" />
            <circle cx="17.5" cy="7" r="1.1" fill="#F5EBDD" />
          </svg>
        </span>
        <span className="font-display text-[17px] leading-tight text-cream">
          our little
          <br />
          <span className="italic text-peach">world</span>
        </span>
      </NavLink>
      <ul className="flex flex-col gap-0.5">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} className={({ isActive }) => cn('group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition', isActive ? 'text-cream' : 'text-muted hover:text-cream')}>
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="sidebar-active" className="absolute inset-0 rounded-xl bg-surface-2 ring-1 ring-line" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                  <Icon className={cn('relative h-[18px] w-[18px] transition', isActive ? 'text-peach' : 'group-hover:text-cream-dim')} aria-hidden />
                  <span className="relative">{label}</span>
                  {to === '/gifts' && unopened > 0 && <span className="relative ml-auto h-2 w-2 rounded-full bg-peach" aria-label={`${unopened} unopened`} />}
                  {to === '/chat' && <ChatDot />}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
      {NAV_LOCKED.length > 0 && (
        <div className="mt-4 border-t border-line pt-4" aria-label="Coming later">
          <p className="eyebrow mb-2 px-3">Coming later</p>
          <ul className="flex flex-col gap-0.5">
            {NAV_LOCKED.map(({ to, label, icon: Icon }) => (
              <li key={to} className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2 text-sm text-faint" aria-disabled="true" title="Not open yet">
                <Icon className="h-[18px] w-[18px]" aria-hidden />
                <span>{label}</span>
                <Lock className="ml-auto h-3.5 w-3.5" aria-label="locked" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}

function ChatDot() {
  const typing = useChatStore((s) => s.partnerTyping);
  if (!typing) return null;
  return <span className="relative ml-auto text-[11px] text-lavender">typing…</span>;
}
