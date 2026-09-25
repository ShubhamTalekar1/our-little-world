import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../lib/cn';

export default function ActivityCard({ to, emoji, title, subtitle, status, tone = 'peach', index = 0, onClick, className }) {
  const tones = {
    peach: 'from-peach/20',
    lavender: 'from-lavender/20',
    lamp: 'from-lamp/20',
    sage: 'from-sage/20',
    sky: 'from-sky/20',
    rose: 'from-rose/20',
  };
  const Comp = to ? Link : 'button';
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -3 }} className={className}>
      <Comp
        to={to}
        onClick={onClick}
        className={cn('group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-line bg-gradient-to-br to-surface/60 p-5 text-left transition hover:border-line-strong', tones[tone])}
      >
        <span className="text-3xl transition group-hover:scale-110" aria-hidden>
          {emoji}
        </span>
        <span className="mt-4 font-display text-lg text-cream">{title}</span>
        {subtitle && <span className="mt-1 text-[13px] text-muted">{subtitle}</span>}
        {status && <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-ink/40 px-2.5 py-1 text-[11px] text-cream-dim">{status}</span>}
        <ArrowRight className="absolute right-5 top-5 h-4 w-4 text-faint transition group-hover:translate-x-0.5 group-hover:text-cream" aria-hidden />
      </Comp>
    </motion.div>
  );
}
