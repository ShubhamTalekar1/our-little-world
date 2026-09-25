import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useUiStore } from '../../stores/uiStore';
import { useGiftStore } from '../../stores/giftStore';
import { usePeopleStore } from '../../stores/peopleStore';
import { GIFTS_BY_ID, giftPhrase } from '../../catalog/gifts';
import { wordsFor } from '../../lib/words';
import { playSfx } from '../../services/audio/sfx';
import { realtime } from '../../services/realtime';
import { EV } from '../../services/realtime/events';
import GiftArt from './GiftArt';
import Button from '../ui/Button';

/**
 * Receiving a gift: dim → a wrapped box arrives → it wiggles → you open it →
 * the lid pops, the item rises with a glow, the note appears.
 */
export default function GiftOpeningModal() {
  const id = useUiStore((s) => s.openingGiftId);
  const close = () => useUiStore.getState().setOpeningGift(null);
  const record = useGiftStore((s) => s.received.find((g) => g.id === id));
  const people = usePeopleStore();
  const [stage, setStage] = useState('box'); // box → opening → revealed
  const [revealed, setRevealed] = useState(null);

  useEffect(() => {
    if (!id) return;
    setStage(record?.opened ? 'revealed' : 'box');
    setRevealed(record?.opened ? record.revealed ?? record.giftId : null);
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!record) return null;
  const sender = record.from === people.partner?.id ? people.partner : people.me;
  const w = wordsFor(sender);
  const gift = GIFTS_BY_ID[revealed ?? record.giftId];

  const open = () => {
    setStage('opening');
    playSfx('open');
    setTimeout(() => {
      const r = useGiftStore.getState().open(record.id);
      setRevealed(r?.revealed ?? record.giftId);
      setStage('revealed');
      playSfx('gift');
    }, 1100);
  };
  const kissBack = () => {
    realtime.emit(EV.INTERACTION, { type: 'kiss' });
    useUiStore.getState().playInteraction('kiss', 'me');
    useUiStore.getState().toast('Kiss sent 😘', { emoji: '💋' });
    close();
  };

  return createPortal(
    <AnimatePresence>
      {id && (
        <motion.div className="fixed inset-0 z-[65] grid place-items-center p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="A gift for you">
          <motion.div className="absolute inset-0 bg-[#06060b]/90 backdrop-blur-md" onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(242,201,139,0.16),transparent_55%)]" />
          <div className="relative flex w-full max-w-sm flex-col items-center text-center">
            <AnimatePresence mode="wait">
              {stage !== 'revealed' ? (
                <motion.div key="box" className="flex flex-col items-center" exit={{ opacity: 0, scale: 1.2 }} transition={{ duration: 0.3 }}>
                  <p className="eyebrow mb-6">Someone sent you something ❤️</p>
                  <motion.div
                    initial={{ y: 80, scale: 0.6, opacity: 0 }}
                    animate={stage === 'opening' ? { rotate: [0, -8, 8, -10, 10, -6, 0], scale: [1, 1.05, 1.1, 1.15] } : { y: 0, scale: 1, opacity: 1, rotate: [0, -3, 3, 0] }}
                    transition={stage === 'opening' ? { duration: 1.1 } : { type: 'spring', stiffness: 120, damping: 12, rotate: { duration: 1.6, repeat: Infinity, repeatDelay: 1 } }}
                  >
                    <WrappedBox opening={stage === 'opening'} />
                  </motion.div>
                  <Button variant="primary" size="lg" className="mt-10" onClick={open} disabled={stage === 'opening'} data-autofocus>
                    Open gift
                  </Button>
                  <button onClick={close} className="mt-3 text-xs text-muted hover:text-cream">
                    Save it for later
                  </button>
                </motion.div>
              ) : (
                <motion.div key="reveal" className="flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <motion.div initial={{ scale: 0.2, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 11 }} className="relative">
                    <motion.div className="absolute inset-[-40%] rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(242,201,139,0.25),transparent_30%)]" animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }} aria-hidden />
                    <GiftArt gift={gift} size={170} />
                  </motion.div>
                  {Array.from({ length: 14 }).map((_, i) => (
                    <motion.span
                      key={i}
                      className="absolute top-16 text-base"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0], x: Math.cos((i / 14) * Math.PI * 2) * 170, y: Math.sin((i / 14) * Math.PI * 2) * 170 + 60 }}
                      transition={{ duration: 1.6, delay: 0.1 }}
                      aria-hidden
                    >
                      {i % 2 ? '✨' : '🤍'}
                    </motion.span>
                  ))}
                  <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-6 text-2xl text-cream">
                    {w.Subject} sent you {giftPhrase(gift)} {gift.emoji}
                  </motion.h2>
                  {record.message && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="hand mt-3 text-3xl text-peach">
                      “{record.message}”
                    </motion.p>
                  )}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="mt-8 flex flex-col items-center gap-2">
                    {sender?.id !== people.me?.id && (
                      <Button variant="primary" size="lg" onClick={kissBack} data-autofocus>
                        Send a kiss back 😘
                      </Button>
                    )}
                    <button onClick={close} className="text-xs text-muted hover:text-cream">
                      Keep it in my collection
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function WrappedBox({ opening }) {
  return (
    <svg viewBox="0 0 160 160" width="180" height="180" aria-hidden style={{ overflow: 'visible' }}>
      <ellipse cx="80" cy="150" rx="56" ry="8" fill="#000" opacity=".4" />
      <rect x="24" y="66" width="112" height="82" rx="10" fill="#B8A7D9" />
      <rect x="24" y="66" width="112" height="82" rx="10" fill="url(#boxShade)" />
      <rect x="72" y="66" width="16" height="82" fill="#F5EBDD" />
      <motion.g animate={opening ? { y: [0, -6, -60], rotate: [0, -4, -24], opacity: [1, 1, 0] } : { y: 0 }} transition={{ duration: 1.05, times: [0, 0.6, 1] }} style={{ originX: 0.3, originY: 1 }}>
        <rect x="16" y="46" width="128" height="26" rx="8" fill="#C9B8E6" />
        <rect x="72" y="46" width="16" height="26" fill="#F5EBDD" />
        <path d="M80,46 C60,20 36,30 52,44 C58,48 70,48 80,46 Z" fill="#E8B4A0" />
        <path d="M80,46 C100,20 124,30 108,44 C102,48 90,48 80,46 Z" fill="#E8B4A0" />
        <circle cx="80" cy="45" r="7" fill="#D4937C" />
      </motion.g>
      {opening && <motion.circle cx="80" cy="60" r="10" fill="#F2C98B" initial={{ opacity: 0, r: 10 }} animate={{ opacity: [0, 0.8, 0], r: [10, 90] }} transition={{ duration: 1.1 }} />}
      <defs>
        <linearGradient id="boxShade" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".12" />
          <stop offset="1" stopColor="#000" stopOpacity=".18" />
        </linearGradient>
      </defs>
    </svg>
  );
}
