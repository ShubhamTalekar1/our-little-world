import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PhoneOff } from 'lucide-react';
import { useCallStore } from '../../stores/callStore';
import { useClock } from '../room/effects';
import { usePartnerWords } from '../../lib/words';

export const elapsed = (from, now = Date.now()) => {
  const s = Math.max(0, Math.floor((now - from) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Keeps an ongoing call visible while you wander around the world. */
export default function CallPill() {
  const { status, startedAt, leave } = useCallStore();
  const location = useLocation();
  const navigate = useNavigate();
  const now = useClock(1000);
  const w = usePartnerWords();
  const hidden = /^\/together\/(call|movie|dance)/.test(location.pathname);
  return (
    <AnimatePresence>
      {status !== 'idle' && !hidden && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass fixed right-4 top-20 z-40 flex items-center gap-2 rounded-full py-1.5 pl-3 pr-1.5 shadow-soft">
          <button onClick={() => navigate('/together/call')} className="flex items-center gap-2 text-sm text-cream">
            <span className="h-2 w-2 animate-pulse rounded-full bg-sage" aria-hidden />
            {status === 'connected' ? `With ${w.them} · ${elapsed(startedAt, now)}` : `Waiting for ${w.them}…`}
          </button>
          <button onClick={leave} className="grid h-8 w-8 place-items-center rounded-full bg-rose text-ink" aria-label="End call">
            <PhoneOff className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
