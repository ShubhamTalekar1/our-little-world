import { motion } from 'framer-motion';

export default function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
      <span>
        <span className="block text-sm text-cream">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full border transition ${checked ? 'border-peach/50 bg-peach/80' : 'border-line bg-surface-3'}`}
      >
        <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 32 }} className={`absolute top-0.5 h-5.5 w-5.5 rounded-full bg-cream shadow ${checked ? 'right-0.5' : 'left-0.5'}`} />
      </button>
    </label>
  );
}
