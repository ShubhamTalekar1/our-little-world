import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ellipsis } from 'lucide-react';
import { NAV, MOBILE_PRIMARY } from './nav';
import { useUiStore } from '../../stores/uiStore';
import { cn } from '../../lib/cn';

export default function BottomNav() {
  const setMore = useUiStore((s) => s.setMobileMoreOpen);
  const items = MOBILE_PRIMARY.map((to) => NAV.find((n) => n.to === to));
  const cols = items.length + 1;
  return (
    <nav aria-label="Main" className="glass safe-bottom fixed inset-x-3 bottom-3 z-40 rounded-3xl lg:hidden">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} className={({ isActive }) => cn('relative flex flex-col items-center gap-1 py-2.5 text-[10.5px] transition', isActive ? 'text-cream' : 'text-muted')}>
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="bottom-active" className="absolute inset-x-3 inset-y-1 rounded-2xl bg-surface-3/70" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                  <Icon className={cn('relative h-5 w-5', isActive && 'text-peach')} aria-hidden />
                  <span className="relative">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
        <li>
          <button onClick={() => setMore(true)} className="flex w-full flex-col items-center gap-1 py-2.5 text-[10.5px] text-muted">
            <Ellipsis className="h-5 w-5" aria-hidden />
            More
          </button>
        </li>
      </ul>
    </nav>
  );
}
