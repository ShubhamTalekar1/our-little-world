import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NAV } from './nav';
import { useChatStore } from '../../stores/chatStore';
import { useUnopenedGifts } from '../../stores/giftStore';
import { cn } from '../../lib/cn';

export default function Sidebar() {
  const unopened = useUnopenedGifts().length;
  return (
    <nav aria-label="Main" className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-night/60 px-4 py-6 backdrop-blur-xl lg:flex">
      <NavLink to="/" className="mb-8 flex items-center gap-2.5 px-2" aria-label="Our little world — home">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-peach/30 to-lavender/30 ring-1 ring-line-strong">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path d="M12 20s-7-4.2-7-9.4A4 4 0 0 1 12 8a4 4 0 0 1 7 2.6C19 15.8 12 20 12 20z" fill="#E8B4A0" />
          </svg>
        </span>
        <span className="font-display text-[17px] leading-tight text-cream">
          our little
          <br />
          <span className="italic text-peach">world</span>
        </span>
      </NavLink>
      <ul className="flex flex-1 flex-col gap-0.5">
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
    </nav>
  );
}

function ChatDot() {
  const typing = useChatStore((s) => s.partnerTyping);
  if (!typing) return null;
  return <span className="relative ml-auto text-[11px] text-lavender">typing…</span>;
}
