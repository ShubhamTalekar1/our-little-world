import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Room from '../components/room/Room';
import Button from '../components/ui/Button';
import ChatPanel from '../components/chat/ChatPanel';
import { VideoTile, CallControls, useReactions, ReactionBurst } from '../components/activities/VideoCall';
import { elapsed } from '../components/activities/CallPill';
import { useCallStore } from '../stores/callStore';
import { useAvatarStore } from '../stores/avatarStore';
import { usePeopleStore } from '../stores/peopleStore';
import { useActivityStore } from '../stores/activityStore';
import { usePresenceStore } from '../stores/presenceStore';
import { useClock } from '../components/room/effects';
import { usePartnerWords } from '../lib/words';
import { cn } from '../lib/cn';

export default function CallRoom() {
  const call = useCallStore();
  const me = usePeopleStore((s) => s.me);
  const partner = usePeopleStore((s) => s.partner);
  const avatars = useAvatarStore((s) => s.avatars);
  const invite = useActivityStore((s) => s.invite);
  const partnerStatus = usePresenceStore((s) => s.partner.status);
  const w = usePartnerWords();
  const [chat, setChat] = useState(false);
  const reactions = useReactions();
  const now = useClock(1000);
  const stage = useRef(null);

  if (call.status === 'idle') {
    return (
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">Video call</p>
        <h1 className="mt-2 text-4xl font-light text-cream">Come sit with me ❤️</h1>
        <p className="mt-2 text-muted">Just the two of you, on the couch, for as long as you like.</p>
        <Room mode="mini" showFurniture className="mx-auto mt-8 aspect-[16/10] rounded-4xl ring-1 ring-line" />
        <div className="mt-6 flex flex-col items-center gap-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              if (partnerStatus !== 'offline') invite('call');
              call.join();
            }}
          >
            Sit down together
          </Button>
          <p className="text-xs text-muted">We’ll ask for your camera and mic. You can turn either off any time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4', chat && 'lg:grid-cols-[minmax(0,1fr)_360px]')}>
      <div ref={stage} className="relative aspect-[3/4] overflow-hidden rounded-4xl bg-night ring-1 ring-line sm:aspect-video">
        <VideoTile stream={call.remote} remote label={w.name} avatar={avatars[partner?.id]} flip talking={call.status === 'connected'} headSize={220} className="absolute inset-0" />
        <AnimatePresence>
          {call.status === 'connecting' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 grid place-items-center bg-ink/50 backdrop-blur-sm">
              <p className="hand text-3xl text-cream">Waiting for {w.them} to sit down…</p>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div drag dragConstraints={stage} dragMomentum={false} className="absolute right-4 top-4 h-32 w-24 cursor-grab overflow-hidden rounded-3xl shadow-soft ring-2 ring-lavender/50 active:cursor-grabbing sm:h-40 sm:w-32">
          <VideoTile stream={call.sharing ? call.screen : call.local} mirrored={!call.sharing} muted off={!call.camOn && !call.sharing} label={call.sharing ? 'Your screen' : 'You'} avatar={avatars[me?.id]} headSize={80} className="h-full w-full" />
        </motion.div>
        {call.status === 'connected' && <span className="absolute left-4 top-4 rounded-full bg-ink/60 px-3 py-1 text-xs text-cream backdrop-blur">Together · {elapsed(call.startedAt, now)}</span>}
        {call.mediaError && <span className="absolute left-4 top-12 max-w-xs rounded-2xl bg-ink/70 px-3 py-1.5 text-xs text-cream-dim backdrop-blur">{call.mediaError}</span>}
        <ReactionBurst items={reactions.items} />
        <div className="absolute inset-x-0 bottom-4 flex justify-center">
          <CallControls reactions={reactions} onChat={() => setChat((v) => !v)} chatOpen={chat} onLeave={call.leave} />
        </div>
      </div>
      <AnimatePresence>
        {chat && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="card flex h-[420px] flex-col overflow-hidden lg:h-auto">
            <ChatPanel compact className="flex-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
