import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaceSlightlySmilingPlus, CheckCheck, Check, Play, Pause } from 'lucide-react';
import { STICKERS_BY_ID } from '../../services/media/gifs';
import { formatTime } from '../../lib/time';
import { cn } from '../../lib/cn';

const QUICK = ['❤️', '🥹', '😂', '😮', '🔥', '👍'];

function VoiceNote({ url, duration, mine }) {
  const [audio] = useState(() => (typeof Audio !== 'undefined' ? new Audio(url) : null));
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      audio.onended = () => setPlaying(false);
      setPlaying(true);
    }
  };
  return (
    <button onClick={toggle} className="flex items-center gap-3 py-0.5" aria-label={playing ? 'Pause voice note' : `Play voice note, ${duration} seconds`}>
      <span className={cn('grid h-8 w-8 place-items-center rounded-full', mine ? 'bg-ink/20' : 'bg-peach/20 text-peach')}>{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</span>
      <span className="flex h-6 items-center gap-[3px]" aria-hidden>
        {Array.from({ length: 18 }, (_, i) => (
          <span key={i} className={cn('w-[3px] rounded-full', mine ? 'bg-ink/40' : 'bg-cream/40', playing && 'animate-pulse')} style={{ height: `${30 + Math.abs(Math.sin(i * 1.7)) * 70}%`, animationDelay: `${i * 60}ms` }} />
        ))}
      </span>
      <span className="text-xs tabular-nums opacity-70">0:{String(duration).padStart(2, '0')}</span>
    </button>
  );
}

export default function MessageBubble({ message, mine, showTime, onReact, myId, partnerName }) {
  const [picker, setPicker] = useState(false);
  const reactions = Object.entries(message.reactions ?? {});
  const sticker = message.type === 'sticker' ? STICKERS_BY_ID[message.stickerId] : null;
  const bare = message.type === 'sticker' || message.type === 'image';
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      className={cn('group flex flex-col', mine ? 'items-end' : 'items-start')}
    >
      <div className={cn('relative flex max-w-[82%] items-center gap-1.5 sm:max-w-[68%]', mine && 'flex-row-reverse')}>
        <div
          className={cn(
            'relative text-[14.5px] leading-relaxed',
            !bare && 'rounded-3xl px-4 py-2.5',
            !bare && (mine ? 'rounded-br-lg bg-gradient-to-br from-peach to-[#e3a58f] text-ink' : 'rounded-bl-lg bg-surface-2 text-cream ring-1 ring-line'),
          )}
        >
          {message.type === 'text' && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
          {message.type === 'image' && <img src={message.url} alt={message.text || 'Shared photo'} className="max-h-72 rounded-3xl object-cover ring-1 ring-line" loading="lazy" />}
          {message.type === 'voice' && <VoiceNote url={message.url} duration={message.duration} mine={mine} />}
          {sticker && (
            <span className={`inline-block text-6xl sticker-${sticker.anim}`} role="img" aria-label={`${sticker.label} sticker`}>
              {sticker.emoji}
            </span>
          )}
        </div>
        <button
          onClick={() => setPicker((v) => !v)}
          className="rounded-full p-1.5 text-faint opacity-0 transition hover:bg-surface-3 hover:text-cream focus:opacity-100 group-hover:opacity-100"
          aria-label="React to message"
          aria-expanded={picker}
        >
          <FaceSlightlySmilingPlus className="h-4 w-4" />
        </button>
        <AnimatePresence>
          {picker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn('glass absolute -top-11 z-10 flex gap-0.5 rounded-full p-1 shadow-soft', mine ? 'right-0' : 'left-0')}
              role="menu"
            >
              {QUICK.map((e) => (
                <button
                  key={e}
                  role="menuitem"
                  onClick={() => {
                    onReact(message.id, e);
                    setPicker(false);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-full text-lg transition hover:scale-125 hover:bg-surface-3"
                  aria-label={`React ${e}`}
                >
                  {e}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {reactions.length > 0 && (
        <div className={cn('-mt-1.5 flex gap-0.5', mine ? 'mr-3' : 'ml-3')}>
          {reactions.map(([uid, e]) => (
            <motion.span key={uid} initial={{ scale: 0 }} animate={{ scale: 1 }} className="rounded-full bg-surface-3 px-1.5 py-0.5 text-xs ring-2 ring-ink" title={uid === myId ? 'You' : partnerName}>
              {e}
            </motion.span>
          ))}
        </div>
      )}
      {showTime && (
        <span className="mt-1 flex items-center gap-1 px-2 text-[10.5px] text-faint">
          {formatTime(message.at)}
          {mine && (message.readAt ? <CheckCheck className="h-3 w-3 text-lavender" aria-label="Read" /> : <Check className="h-3 w-3" aria-label="Sent" />)}
          {mine && message.readAt && <span className="text-lavender/80">Read</span>}
        </span>
      )}
    </motion.div>
  );
}
