import { motion } from 'framer-motion';
import { Trash } from 'lucide-react';
import { formatDate } from '../../lib/time';
import { cn } from '../../lib/cn';

/** Alternating scrapbook timeline. items: { id, emoji, title, note, date, future?, removable? } */
export default function Timeline({ items, onRemove }) {
  return (
    <ol className="relative mx-auto max-w-3xl">
      <div className="absolute bottom-0 left-5 top-0 w-px bg-gradient-to-b from-transparent via-peach/40 to-transparent sm:left-1/2" aria-hidden />
      {items.map((m, i) => {
        const left = i % 2 === 0;
        return (
          <motion.li
            key={m.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5 }}
            className={cn('relative mb-8 pl-14 sm:w-1/2 sm:pl-0', left ? 'sm:pr-12 sm:text-right' : 'sm:ml-auto sm:pl-12')}
          >
            <span className={cn('absolute left-0 top-2 grid h-10 w-10 place-items-center rounded-full text-lg ring-4 ring-ink sm:top-3', m.future ? 'bg-lavender/30 ring-lavender/20' : 'bg-surface-3', left ? 'sm:left-auto sm:-right-5' : 'sm:-left-5')} aria-hidden>
              {m.emoji}
            </span>
            <div className={cn('group relative inline-block w-full rounded-3xl p-5 text-left', m.future ? 'border border-dashed border-lavender/40 bg-lavender/5' : 'paper shadow-soft')} style={m.future ? undefined : { transform: `rotate(${left ? -0.8 : 0.8}deg)` }}>
              <p className={cn('text-[11px] uppercase tracking-[0.2em]', m.future ? 'text-lavender' : 'text-[#8a7d6d]')}>{m.future ? 'Soon' : formatDate(m.date, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <h3 className={cn('hand mt-1 text-3xl leading-tight', m.future ? 'text-cream' : 'text-[#3b3128]')}>{m.title}</h3>
              {m.note && <p className={cn('mt-1 text-sm', m.future ? 'text-muted' : 'text-[#5a4a3a]')}>{m.note}</p>}
              {m.removable && onRemove && (
                <button onClick={() => onRemove(m.id)} className="absolute right-3 top-3 rounded-lg p-1.5 text-[#8a7d6d] opacity-0 transition hover:text-rose focus:opacity-100 group-hover:opacity-100" aria-label={`Remove ${m.title}`}>
                  <Trash className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
