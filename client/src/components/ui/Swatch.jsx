import { cn } from '../../lib/cn';
import { Check } from 'lucide-react';

export default function Swatch({ color, selected, onClick, label }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
      className={cn('relative h-9 w-9 rounded-full border-2 transition hover:scale-105', selected ? 'border-cream' : 'border-transparent')}
      style={{ background: color, boxShadow: 'inset 0 -3px 6px rgba(0,0,0,.2)' }}
    >
      {selected && <Check className="absolute inset-0 m-auto h-4 w-4 text-ink/70" />}
    </button>
  );
}
