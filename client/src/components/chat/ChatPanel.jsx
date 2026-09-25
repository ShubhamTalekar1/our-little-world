import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, FaceSlightlySmiling, Image as ImageIcon, Mic, Sticker, X, Square } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import EmptyState from '../ui/EmptyState';
import { useChatStore } from '../../stores/chatStore';
import { usePeopleStore } from '../../stores/peopleStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { toast } from '../../stores/uiStore';
import { realtime } from '../../services/realtime';
import { EV } from '../../services/realtime/events';
import { gifProvider } from '../../services/media/gifs';
import { uploadImage } from '../../services/media/upload';
import { blobToDataUrl } from '../../services/media/imageTools';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { usePartnerWords } from '../../lib/words';
import { dayLabel } from '../../lib/time';
import { playSfx } from '../../services/audio/sfx';
import { cn } from '../../lib/cn';

const EMOJIS = ['❤️', '🥰', '😘', '🥹', '😂', '😊', '🤍', '✨', '🌙', '☀️', '🌧️', '☕', '🍿', '🎬', '💃', '🌷', '🌹', '🫶', '🙈', '😴', '🤗', '💌', '🎁', '🔥'];

function Composer({ compact }) {
  const [text, setText] = useState('');
  const [panel, setPanel] = useState(null); // 'emoji' | 'sticker'
  const [stickers, setStickers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const send = useChatStore((s) => s.send);
  const typingEnabled = useSettingsStore((s) => s.privacy.typingIndicator);
  const w = usePartnerWords();
  const fileRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimer = useRef(null);
  const lastTyping = useRef(0);

  const voice = useVoiceRecorder({
    onDone: async (blob, duration) => {
      const url = await blobToDataUrl(blob);
      send({ type: 'voice', url, duration });
      playSfx('message');
    },
    onError: (msg) => toast(msg, { emoji: '🎙️', tone: 'error' }),
  });

  useEffect(() => {
    if (panel === 'sticker') gifProvider.search('').then(setStickers);
  }, [panel]);

  const onType = (v) => {
    setText(v);
    if (!typingEnabled) return;
    if (Date.now() - lastTyping.current > 2000) {
      realtime.emit(EV.CHAT_TYPING, { typing: true });
      lastTyping.current = Date.now();
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => realtime.emit(EV.CHAT_TYPING, { typing: false }), 2500);
  };

  const submit = () => {
    if (!text.trim()) return;
    send(text);
    setText('');
    setPanel(null);
    clearTimeout(typingTimer.current);
    if (typingEnabled) realtime.emit(EV.CHAT_TYPING, { typing: false });
    playSfx('tap');
    inputRef.current?.focus();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, { max: 1000 });
      send({ type: 'image', url });
    } catch (err) {
      toast(err.message, { emoji: '🖼️', tone: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative border-t border-line p-2.5 sm:p-3">
      <AnimatePresence>
        {panel && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="glass absolute inset-x-2.5 bottom-full mb-2 max-h-56 overflow-y-auto rounded-2xl p-2 shadow-soft"
          >
            {panel === 'emoji' ? (
              <div className="grid grid-cols-8 gap-1">
                {EMOJIS.map((e) => (
                  <button key={e} onClick={() => setText((t) => t + e)} className="grid h-9 place-items-center rounded-lg text-xl hover:bg-surface-3" aria-label={`Insert ${e}`}>
                    {e}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-1 sm:grid-cols-8">
                {stickers.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      send({ type: 'sticker', stickerId: s.id });
                      setPanel(null);
                    }}
                    className="flex flex-col items-center rounded-xl py-1.5 hover:bg-surface-3"
                    aria-label={`Send ${s.label} sticker`}
                  >
                    <span className={`text-3xl sticker-${s.anim}`}>{s.emoji}</span>
                    <span className="text-[10px] text-muted">{s.label}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {voice.recording ? (
        <div className="flex items-center gap-3 rounded-2xl bg-rose/10 px-3 py-2 ring-1 ring-rose/30" role="status">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose" />
          <span className="flex-1 text-sm text-cream">Recording… 0:{String(voice.seconds).padStart(2, '0')}</span>
          <button onClick={voice.cancel} className="rounded-xl p-2 text-muted hover:text-cream" aria-label="Cancel recording">
            <X className="h-4 w-4" />
          </button>
          <button onClick={voice.stop} className="flex items-center gap-1.5 rounded-xl bg-peach px-3 py-2 text-xs font-medium text-ink" aria-label="Send voice note">
            <Square className="h-3 w-3" /> Send
          </button>
        </div>
      ) : (
        <div className="flex items-end gap-1.5">
          <div className="flex">
            <button onClick={() => setPanel(panel === 'emoji' ? null : 'emoji')} className={cn('rounded-xl p-2.5 transition hover:bg-surface-3 hover:text-cream', panel === 'emoji' ? 'text-peach' : 'text-muted')} aria-label="Emoji" aria-expanded={panel === 'emoji'}>
              <FaceSlightlySmiling className="h-5 w-5" />
            </button>
            <button onClick={() => setPanel(panel === 'sticker' ? null : 'sticker')} className={cn('rounded-xl p-2.5 transition hover:bg-surface-3 hover:text-cream', panel === 'sticker' ? 'text-peach' : 'text-muted')} aria-label="Stickers" aria-expanded={panel === 'sticker'}>
              <Sticker className="h-5 w-5" />
            </button>
            {!compact && (
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-xl p-2.5 text-muted transition hover:bg-surface-3 hover:text-cream" aria-label="Send a photo">
                <ImageIcon className={cn('h-5 w-5', uploading && 'animate-pulse')} />
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onFile} />
          </div>
          <label htmlFor="chat-input" className="sr-only">
            Message {w.them}
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            rows={1}
            value={text}
            maxLength={2000}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={`Say something to ${w.them}…`}
            className="field max-h-32 min-h-11 flex-1 resize-none py-2.5"
          />
          {text.trim() ? (
            <motion.button whileTap={{ scale: 0.9 }} onClick={submit} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-peach text-ink" aria-label="Send message">
              <Send className="h-4.5 w-4.5" />
            </motion.button>
          ) : (
            <motion.button whileTap={{ scale: 0.9 }} onClick={voice.start} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface-3 text-cream-dim hover:text-cream" aria-label="Record a voice note">
              <Mic className="h-4.5 w-4.5" />
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}

/** The conversation. Reused in the chat page and inside shared activities. */
export default function ChatPanel({ className, compact = false, limit }) {
  const messages = useChatStore((s) => s.messages);
  const typing = useChatStore((s) => s.partnerTyping);
  const reactMine = useChatStore((s) => s.reactMine);
  const me = usePeopleStore((s) => s.me);
  const partner = usePeopleStore((s) => s.partner);
  const readReceipts = useSettingsStore((s) => s.privacy.readReceipts);
  const w = usePartnerWords();
  const scroller = useRef(null);
  const shown = limit ? messages.slice(-limit) : messages;

  // Scroll to bottom on new messages
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [shown.length, typing]);

  // Let them know I've read their latest message
  const lastTheirs = [...messages].reverse().find((m) => m.from !== me?.id);
  useEffect(() => {
    if (lastTheirs && readReceipts) realtime.emit(EV.CHAT_READ, { at: new Date().toISOString() });
  }, [lastTheirs?.id, readReceipts]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = useMemo(() => {
    const out = [];
    let lastDay = null;
    shown.forEach((m, i) => {
      const day = dayLabel(m.at);
      if (!compact && day !== lastDay) {
        out.push({ kind: 'day', id: `d-${m.id}`, label: day });
        lastDay = day;
      }
      const next = shown[i + 1];
      const showTime = !next || next.from !== m.from || new Date(next.at) - new Date(m.at) > 5 * 60_000;
      out.push({ kind: 'msg', id: m.id, m, showTime });
    });
    return out;
  }, [shown, compact]);

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div ref={scroller} className="flex-1 overflow-y-auto px-3 py-4 sm:px-5" role="log" aria-live="polite" aria-label={`Conversation with ${w.name}`}>
        {shown.length === 0 ? (
          <EmptyState emoji="💬" title="Say hi">
            This is just for the two of you.
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map((r) =>
              r.kind === 'day' ? (
                <div key={r.id} className="my-3 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-faint">
                  <span className="h-px flex-1 bg-line" />
                  {r.label}
                  <span className="h-px flex-1 bg-line" />
                </div>
              ) : (
                <MessageBubble key={r.id} message={r.m} mine={r.m.from === me?.id} showTime={r.showTime} onReact={reactMine} myId={me?.id} partnerName={partner?.name} />
              ),
            )}
            <AnimatePresence>{typing && <TypingIndicator name={w.name} />}</AnimatePresence>
          </div>
        )}
      </div>
      <Composer compact={compact} />
    </div>
  );
}
