import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useWalletStore, DAILY_REWARD } from '../../stores/walletStore';
import { toast } from '../../stores/uiStore';
import { playSfx } from '../../services/audio/sfx';
import { cn } from '../../lib/cn';

export function CoinIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <circle cx="10" cy="10" r="9" fill="#F2C98B" />
      <circle cx="10" cy="10" r="6.5" fill="none" stroke="#D4A55B" strokeWidth="1.2" />
      <path d="M10 13.6s-3.2-1.9-3.2-4.2A1.8 1.8 0 0 1 10 8.2a1.8 1.8 0 0 1 3.2 1.2c0 2.3-3.2 4.2-3.2 4.2z" fill="#C4845A" />
    </svg>
  );
}

export function CoinAmount({ amount, className }) {
  return (
    <span className={cn('inline-flex items-center gap-1 tabular-nums', className)}>
      <CoinIcon className="h-3.5 w-3.5" />
      {amount.toLocaleString()}
    </span>
  );
}

/** Balance + daily reward. Real payments would live behind services/payments. */
export default function VirtualWallet({ className, compact }) {
  const balance = useWalletStore((s) => s.balance);
  const canClaim = useWalletStore((s) => s.canClaimDaily());
  const claim = useWalletStore((s) => s.claimDaily);
  const onClaim = () => {
    if (claim()) {
      playSfx('success');
      toast(`+${DAILY_REWARD} Love Coins — daily hello`, { emoji: '✨' });
    }
  };
  if (compact) {
    return (
      <span className={cn('chip', className)} aria-label={`${balance} Love Coins`}>
        <CoinIcon />
        <motion.span key={balance} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="tabular-nums text-cream">
          {balance.toLocaleString()}
        </motion.span>
      </span>
    );
  }
  return (
    <div className={cn('rounded-2xl border border-line bg-surface/70 p-3.5', className)}>
      <div className="flex items-center gap-2.5">
        <CoinIcon className="h-7 w-7" />
        <div className="min-w-0">
          <motion.p key={balance} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-[15px] font-semibold tabular-nums text-cream">
            {balance.toLocaleString()}
          </motion.p>
          <p className="text-[11px] text-muted">Love Coins</p>
        </div>
      </div>
      <AnimatePresence>
        {canClaim && (
          <motion.button
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onClick={onClaim}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-lamp/15 py-2 text-xs font-medium text-lamp ring-1 ring-lamp/25 hover:bg-lamp/25"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> Daily hello · +{DAILY_REWARD}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
