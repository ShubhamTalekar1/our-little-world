import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { LoaderCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

const VARIANTS = {
  primary: 'bg-gradient-to-b from-peach to-peach-deep text-ink shadow-[0_8px_24px_-10px_rgba(232,180,160,0.7)] hover:brightness-105',
  lavender: 'bg-gradient-to-b from-lavender to-lavender-deep text-ink shadow-[0_8px_24px_-10px_rgba(184,167,217,0.7)] hover:brightness-105',
  soft: 'bg-surface-2/90 text-cream border border-line hover:bg-surface-3 hover:border-line-strong',
  ghost: 'text-cream-dim hover:text-cream hover:bg-surface-2/70',
  outline: 'border border-line-strong text-cream hover:bg-surface-2/60',
  danger: 'bg-rose/15 text-rose border border-rose/30 hover:bg-rose/25',
};
const SIZES = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-xl',
  md: 'h-11 px-5 text-sm gap-2 rounded-2xl',
  lg: 'h-13 px-6 text-[15px] gap-2.5 rounded-2xl',
  icon: 'h-10 w-10 rounded-xl justify-center',
};

const base = 'inline-flex select-none items-center justify-center font-medium transition-[background,filter,border,color] duration-200 disabled:opacity-50';

/** A router link that looks like a button (avoids nesting <button> in <a>). */
export function ButtonLink({ to, variant = 'soft', size = 'md', icon: Icon, className, children, ...props }) {
  return (
    <Link to={to} className={cn(base, VARIANTS[variant], SIZES[size], className)} {...props}>
      {Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
      {children}
    </Link>
  );
}

const Button = forwardRef(function Button(
  { variant = 'soft', size = 'md', loading = false, className, children, icon: Icon, disabled, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      className={cn(
        base,
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
      {children}
    </motion.button>
  );
});

export default Button;
