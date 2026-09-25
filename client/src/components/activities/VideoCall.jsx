import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Video, VideoOff, Mic, MicOff, MonitorUp, PictureInPicture2, PhoneOff, MessageCircle, FaceSlightlySmilingPlus } from 'lucide-react';
import Avatar from '../avatar/Avatar';
import { useCallStore } from '../../stores/callStore';
import { useAvatarStore } from '../../stores/avatarStore';
import { usePeopleStore } from '../../stores/peopleStore';
import { toast } from '../../stores/uiStore';
import { realtime } from '../../services/realtime';
import { EV } from '../../services/realtime/events';
import { usePartnerWords } from '../../lib/words';
import { cn } from '../../lib/cn';

const REACTIONS = ['❤️', '😂', '🥹', '😮', '👏', '🔥'];

export function VideoTile({ stream, mirrored, muted, label, avatar, flip, talking, off, className, videoRef: externalRef, hideLabel, remote: isRemote, headSize = 120 }) {
  const ref = useRef(null);
  const videoRef = externalRef ?? ref;
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream, videoRef]);
  const showVideo = stream && !off && stream.getVideoTracks().length > 0;
  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-b from-surface-3 to-night', className)}>
      {showVideo ? (
        <video ref={videoRef} data-remote={isRemote ? '' : undefined} autoPlay playsInline muted={muted} className={cn('h-full w-full object-cover', mirrored && '-scale-x-100')} aria-label={label} />
      ) : (
        <div className="grid h-full w-full place-items-center">
          <div className="relative">
            {talking && (
              <motion.span className="absolute inset-[-10%] rounded-full ring-2 ring-peach/40" animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.2, 0.6] }} transition={{ duration: 1.8, repeat: Infinity }} aria-hidden />
            )}
            <div className="overflow-hidden rounded-full bg-surface-2/60">
              <Avatar config={avatar} crop="head" size={headSize} flip={flip} label={label} />
            </div>
          </div>
        </div>
      )}
      {!hideLabel && <span className="absolute bottom-2 left-2 rounded-full bg-ink/60 px-2 py-0.5 text-[11px] text-cream backdrop-blur">{label}</span>}
    </div>
  );
}

export function ReactionBurst({ items }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden>
      <AnimatePresence>
        {items.map((r) => (
          <motion.span
            key={r.id}
            className="absolute bottom-10 text-4xl"
            style={{ left: `${r.x}%` }}
            initial={{ y: 0, opacity: 0, scale: 0.6 }}
            animate={{ y: -260, opacity: [0, 1, 1, 0], scale: [0.6, 1.2, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.4, ease: 'easeOut' }}
          >
            {r.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function useReactions(event = EV.CALL_REACTION) {
  const [items, setItems] = useState([]);
  const add = (emoji, x = 20 + Math.random() * 60) => {
    const id = Math.random().toString(36).slice(2);
    setItems((s) => [...s.slice(-12), { id, emoji, x }]);
    setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 2600);
  };
  useEffect(() => realtime.on(event, ({ emoji }) => add(emoji)), [event]);
  const send = (emoji) => {
    add(emoji);
    realtime.emit(event, { emoji });
  };
  return { items, send };
}

export function CallControls({ onChat, chatOpen, reactions, className, onLeave }) {
  const { camOn, micOn, sharing, local, toggleCam, toggleMic, toggleScreen } = useCallStore();
  const [showReacts, setShowReacts] = useState(false);
  const btn = 'grid h-11 w-11 place-items-center rounded-full transition';
  const pip = async () => {
    const v = document.querySelector('video[data-remote], video');
    if (v && document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else await v.requestPictureInPicture();
        return;
      } catch {
        /* fall through */
      }
    }
    toast('Picture-in-picture needs a live video — it’ll work once you’re both on camera', { emoji: '🪟' });
  };
  return (
    <div className={cn('glass relative flex items-center gap-1.5 rounded-full p-1.5 shadow-soft', className)} role="toolbar" aria-label="Call controls">
      <button onClick={() => !toggleCam() && toast('No camera available', { emoji: '📷' })} className={cn(btn, camOn ? 'bg-surface-3 text-cream' : 'bg-rose/20 text-rose')} aria-label={camOn ? 'Turn camera off' : 'Turn camera on'} aria-pressed={!camOn} disabled={!local}>
        {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </button>
      <button onClick={() => !toggleMic() && toast('No microphone available', { emoji: '🎙️' })} className={cn(btn, micOn ? 'bg-surface-3 text-cream' : 'bg-rose/20 text-rose')} aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'} aria-pressed={!micOn} disabled={!local}>
        {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </button>
      <button
        onClick={async () => {
          const ok = await toggleScreen();
          if (!ok && !sharing) toast('Screen sharing isn’t available here', { emoji: '🖥️' });
        }}
        className={cn(btn, sharing ? 'bg-lavender/25 text-lavender' : 'bg-surface-3 text-cream')}
        aria-label={sharing ? 'Stop sharing screen' : 'Share screen'}
        aria-pressed={sharing}
      >
        <MonitorUp className="h-5 w-5" />
      </button>
      <button onClick={pip} className={cn(btn, 'bg-surface-3 text-cream')} aria-label="Picture in picture">
        <PictureInPicture2 className="h-5 w-5" />
      </button>
      {reactions && (
        <div className="relative">
          <button onClick={() => setShowReacts((v) => !v)} className={cn(btn, 'bg-surface-3 text-cream')} aria-label="Reactions" aria-expanded={showReacts}>
            <FaceSlightlySmilingPlus className="h-5 w-5" />
          </button>
          <AnimatePresence>
            {showReacts && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="glass absolute bottom-14 left-1/2 flex -translate-x-1/2 gap-0.5 rounded-full p-1">
                {REACTIONS.map((e) => (
                  <button key={e} onClick={() => reactions.send(e)} className="grid h-9 w-9 place-items-center rounded-full text-xl hover:bg-surface-3" aria-label={`React ${e}`}>
                    {e}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      {onChat && (
        <button onClick={onChat} className={cn(btn, chatOpen ? 'bg-peach/20 text-peach' : 'bg-surface-3 text-cream')} aria-label={chatOpen ? 'Hide chat' : 'Show chat'} aria-pressed={chatOpen}>
          <MessageCircle className="h-5 w-5" />
        </button>
      )}
      <button onClick={onLeave} className={cn(btn, 'bg-rose text-ink hover:brightness-110')} aria-label="End call">
        <PhoneOff className="h-5 w-5" />
      </button>
    </div>
  );
}

/** Floating bubbles: used over movies and the dance floor. Draggable. */
export function VideoBubbles({ className, containerRef }) {
  const { local, remote, camOn, status } = useCallStore();
  const me = usePeopleStore((s) => s.me);
  const partner = usePeopleStore((s) => s.partner);
  const avatars = useAvatarStore((s) => s.avatars);
  const w = usePartnerWords();
  if (status === 'idle') return null;
  return (
    <motion.div drag dragConstraints={containerRef} dragMomentum={false} className={cn('absolute z-30 flex cursor-grab gap-2 active:cursor-grabbing', className)} aria-label="Video bubbles (drag to move)">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-24 w-24 overflow-hidden rounded-full shadow-soft ring-2 ring-peach/60 sm:h-28 sm:w-28">
        <VideoTile stream={remote} remote hideLabel headSize={96} label={w.name} avatar={avatars[partner?.id]} flip talking={status === 'connected'} className="h-full w-full" />
      </motion.div>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }} className="h-20 w-20 self-end overflow-hidden rounded-full shadow-soft ring-2 ring-lavender/60 sm:h-24 sm:w-24">
        <VideoTile stream={local} mirrored muted hideLabel headSize={80} off={!camOn} label="You" avatar={avatars[me?.id]} className="h-full w-full" />
      </motion.div>
    </motion.div>
  );
}
