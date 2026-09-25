import { motion } from 'framer-motion';
import { POSTER_PALETTES } from '../../lib/poster';
import { cn } from '../../lib/cn';

const barcode = (code) =>
  [...code].flatMap((c, i) => {
    const n = c.charCodeAt(0);
    return [1 + (n % 3), 1 + ((n >> 2) % 2), 2 + ((n + i) % 3)];
  });

/**
 * A paper cinema ticket with a tear-off stub. `torn` animates the stub away
 * (the usher keeps it).
 */
export default function TicketCard({ ticket, holder, torn = false, compact = false, className }) {
  const [top, bottom, accent] = POSTER_PALETTES[(ticket.palette ?? 0) % POSTER_PALETTES.length];
  const row = ticket.seat?.[0];
  const seat = ticket.seat?.slice(1);
  const when = new Date(ticket.createdAt);
  return (
    <div className={cn('relative flex select-none text-ink drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]', compact ? 'h-28' : 'h-40 sm:h-44', className)} aria-label={`Ticket for ${ticket.title}, seat ${ticket.seat}`}>
      {/* main part */}
      <div className="relative flex min-w-0 flex-1 overflow-hidden rounded-l-2xl bg-[#f7efe2]">
        <div className="w-3 shrink-0" style={{ background: `linear-gradient(180deg, ${top}, ${bottom})` }} aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col justify-between p-3 sm:p-4">
          <div className="min-w-0">
            <p className="truncate text-[9px] font-semibold uppercase tracking-[0.3em] text-[#8a6f5a]">Our Little World Cinema · Screen 1</p>
            <p className={cn('truncate font-display leading-tight text-[#2a1a20]', compact ? 'mt-0.5 text-lg' : 'mt-1 text-2xl')}>{ticket.title}</p>
            {!compact && holder && <p className="text-xs text-[#8a6f5a]">Admit one · {holder}</p>}
          </div>
          <div className="flex items-end gap-4 text-[#2a1a20]">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-[#8a6f5a]">Row</p>
              <p className={cn('font-display leading-none', compact ? 'text-xl' : 'text-3xl')}>{row}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-[#8a6f5a]">Seat</p>
              <p className={cn('font-display leading-none', compact ? 'text-xl' : 'text-3xl')}>{seat}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[9px] uppercase tracking-widest text-[#8a6f5a]">Issued</p>
              <p className="text-xs">{when.toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
            </div>
          </div>
        </div>
        {ticket.usedAt && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 -rotate-12 rounded border-2 border-[#b8434f] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#b8434f] opacity-80">Admitted</span>
        )}
      </div>
      {/* perforation */}
      <div className="w-0 border-l-2 border-dashed border-[#d9c9b3]" aria-hidden />
      {/* stub */}
      <motion.div
        animate={torn ? { x: 60, y: 30, rotate: 18, opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeIn' }}
        className={cn('flex shrink-0 flex-col items-center justify-between rounded-r-2xl bg-[#f7efe2] py-3', compact ? 'w-16' : 'w-20 sm:w-24')}
      >
        <p className="font-display text-lg leading-none" style={{ color: accent === '#ffffff' ? top : bottom }}>
          {ticket.seat}
        </p>
        <svg viewBox="0 0 40 60" className={cn('text-[#2a1a20]', compact ? 'h-10' : 'h-14')} aria-hidden>
          {(() => {
            let y = 0;
            return barcode(ticket.code).map((h, i) => {
              const rect = i % 2 === 0 ? <rect key={i} x="0" y={y} width="40" height={h} fill="currentColor" /> : null;
              y += h;
              return y < 60 ? rect : null;
            });
          })()}
        </svg>
        <p className="font-mono text-[8px] tracking-wider text-[#8a6f5a]">{ticket.code.replace('ADMIT-', '')}</p>
      </motion.div>
    </div>
  );
}
