import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

export default function IconButton({ icon: Icon, label, className, active, badge, ...props }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line text-cream-dim transition hover:border-line-strong hover:bg-surface-2 hover:text-cream',
        active && 'border-peach/40 bg-peach/10 text-peach',
        className,
      )}
      {...props}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden />
      {badge ? (
        <span className="absolute -right-1 -top-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-peach px-1 text-[10px] font-semibold text-ink">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </motion.button>
  );
}
