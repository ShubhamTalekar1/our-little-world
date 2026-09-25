import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MOODS, MOODS_BY_ID } from '../../catalog/moods';
import { useCheckinStore } from '../../stores/checkinStore';
import { usePeopleStore } from '../../stores/peopleStore';
import { useWalletStore } from '../../stores/walletStore';
import { toast } from '../../stores/uiStore';
import { usePartnerWords } from '../../lib/words';
import { isSameDay } from '../../lib/time';
import { playSfx } from '../../services/audio/sfx';
import Button from '../ui/Button';

/** A tiny "how was today" — not a tracker, just a window into each other's day. */
export default function DailyCheckin({ className = '' }) {
  const me = usePeopleStore((s) => s.me);
  const partner = usePeopleStore((s) => s.partner);
  const checkins = useCheckinStore((s) => s.checkins);
  const checkIn = useCheckinStore((s) => s.checkIn);
  const w = usePartnerWords();
  const mine = checkins.find((c) => c.userId === me?.id && isSameDay(c.at, Date.now()));
  const theirs = checkins.find((c) => c.userId === partner?.id && isSameDay(c.at, Date.now()));
  const [mood, setMood] = useState(null);
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(false);
  const showForm = !mine || editing;

  const submit = () => {
    if (!mood) return;
    const first = !mine;
    checkIn(me.id, mood, note);
    if (first) useWalletStore.getState().earn(25, 'Daily check-in');
    playSfx('success');
    toast(first ? 'Checked in · +25 Love Coins' : 'Check-in updated', { emoji: MOODS_BY_ID[mood].emoji });
    setEditing(false);
    setMood(null);
    setNote('');
  };

  return (
    <section className={`card p-5 ${className}`} aria-labelledby="checkin-title">
      <h2 id="checkin-title" className="eyebrow">Today</h2>
      {theirs ? (
        <p className="mt-2 text-[15px] text-cream">
          {w.Theyre} feeling <span className="text-lg">{MOODS_BY_ID[theirs.mood]?.emoji}</span> {MOODS_BY_ID[theirs.mood]?.label} today.
          {theirs.note && <span className="hand mt-1 block text-xl text-peach">“{theirs.note}”</span>}
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted">{w.Subject} hasn’t checked in yet today.</p>
      )}
      <div className="my-4 h-px bg-line" />
      <AnimatePresence mode="wait" initial={false}>
        {showForm ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="mb-3 text-sm text-cream-dim">How are you, really?</p>
            <div className="grid grid-cols-6 gap-1" role="radiogroup" aria-label="Your mood today">
              {MOODS.map((m) => (
                <motion.button
                  key={m.id}
                  role="radio"
                  aria-checked={mood === m.id}
                  aria-label={m.label}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setMood(m.id)}
                  className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-2xl transition ${mood === m.id ? 'bg-peach/15 ring-1 ring-peach/50' : 'hover:bg-surface-3'}`}
                >
                  <span aria-hidden>{m.emoji}</span>
                  <span className="text-[10px] text-muted">{m.label}</span>
                </motion.button>
              ))}
            </div>
            <AnimatePresence>
              {mood && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <label className="sr-only" htmlFor="checkin-note">What happened today?</label>
                  <input id="checkin-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="What happened today? (optional)" className="field mt-3" onKeyDown={(e) => e.key === 'Enter' && submit()} />
                  <Button variant="primary" size="sm" className="mt-3 w-full" onClick={submit}>
                    Share with {w.them}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-between gap-3">
            <p className="text-sm text-cream-dim">
              You’re feeling <span className="text-lg">{MOODS_BY_ID[mine.mood]?.emoji}</span> {MOODS_BY_ID[mine.mood]?.label.toLowerCase()}
              {mine.note && <span className="block text-xs text-muted">“{mine.note}”</span>}
            </p>
            <button onClick={() => setEditing(true)} className="shrink-0 text-xs text-muted underline-offset-4 hover:text-cream hover:underline">
              Change
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
