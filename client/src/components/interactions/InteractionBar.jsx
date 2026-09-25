import { useRef } from 'react';
import { motion } from 'framer-motion';
import { INTERACTIONS } from '../../catalog/interactions';
import { useUiStore } from '../../stores/uiStore';
import { useStoryStore } from '../../stores/storyStore';
import { realtime } from '../../services/realtime';
import { EV, interactionEvent } from '../../services/realtime/events';
import { playSfx } from '../../services/audio/sfx';
import { cn } from '../../lib/cn';

export function sendInteraction(id) {
  useUiStore.getState().playInteraction(id, 'me');
  realtime.emit(EV.INTERACTION, { type: id });
  // Also emit the spec-style specific event for listeners that prefer it.
  realtime.emit(interactionEvent(id), {});
  playSfx(id === 'love' || id === 'kiss' ? 'heart' : 'tap');
  if (id === 'hug') useStoryStore.getState().inc('hugs');
}

/** Little gestures: hug, kiss, wave, love, high five, head pat. */
export default function InteractionBar({ className, compact = false }) {
  const last = useRef(0);
  const active = useUiStore((s) => s.interaction);
  const onClick = (id) => {
    if (Date.now() - last.current < 900) return; // gentle throttle
    last.current = Date.now();
    sendInteraction(id);
  };
  return (
    <div role="toolbar" aria-label="Little interactions" className={cn('no-scrollbar flex gap-1.5 overflow-x-auto px-1 py-1 sm:flex-wrap sm:justify-center sm:overflow-visible', className)}>
      {INTERACTIONS.map((ix) => (
        <motion.button
          key={ix.id}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onClick(ix.id)}
          aria-label={ix.id === 'love' ? 'Send love' : `Send ${ix.label.toLowerCase()}`}
          className={cn(
            'glass flex shrink-0 items-center gap-1.5 rounded-full text-[13px] text-cream-dim transition hover:text-cream',
            compact ? 'h-10 w-10 justify-center' : 'px-3.5 py-2',
            active?.id === ix.id && active.by === 'me' && 'ring-1 ring-peach/60',
          )}
        >
          <span className="text-base leading-none" aria-hidden>
            {ix.emoji}
          </span>
          {!compact && ix.label}
        </motion.button>
      ))}
    </div>
  );
}
