import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Video } from 'lucide-react';
import DanceRoom from '../components/activities/DanceRoom';
import MiniPlayer from '../components/music/MiniPlayer';
import Button from '../components/ui/Button';
import { useActivityStore } from '../stores/activityStore';
import { usePresenceStore } from '../stores/presenceStore';
import { useMusicStore } from '../stores/musicStore';
import { useCallStore } from '../stores/callStore';
import { useStoryStore } from '../stores/storyStore';
import { useWalletStore } from '../stores/walletStore';
import { useRoomStore } from '../stores/roomStore';
import { realtime } from '../services/realtime';
import { EV } from '../services/realtime/events';
import { usePartnerWords } from '../lib/words';
import { ENVIRONMENTS } from '../catalog/environments';

export default function SlowDance() {
  const session = useActivityStore((s) => s.sessions.dance);
  const outgoing = useActivityStore((s) => s.outgoing);
  const invite = useActivityStore((s) => s.invite);
  const start = useActivityStore((s) => s.start);
  const end = useActivityStore((s) => s.end);
  const partnerStatus = usePresenceStore((s) => s.partner.status);
  const call = useCallStore();
  const roomEnv = useRoomStore((s) => s.environment);
  const [env, setEnv] = useState(roomEnv === 'bedroom' ? 'rooftop' : roomEnv);
  const w = usePartnerWords();
  const navigate = useNavigate();
  const dancing = !!session;
  const counted = useRef(false);

  // Music + bookkeeping when the dance begins/ends.
  useEffect(() => {
    if (!dancing) return;
    const music = useMusicStore.getState();
    music.play('s3');
    realtime.emit(EV.DANCE_START, { songId: 's3' });
    if (!counted.current) {
      counted.current = true;
      useStoryStore.getState().inc('dances');
      useStoryStore.getState().recordFirst('first-dance', '💃', 'First dance', 'Nobody stepped on anybody’s toes.');
      useWalletStore.getState().earn(30, 'A slow dance');
    }
  }, [dancing]);

  useEffect(() => realtime.on(EV.DANCE_START, () => !useActivityStore.getState().sessions.dance && start('dance')), [start]);
  useEffect(() => realtime.on(EV.DANCE_STOP, () => useActivityStore.getState().end('dance', false)), []);

  const stop = () => {
    realtime.emit(EV.DANCE_STOP, {});
    end('dance');
    useMusicStore.getState().pause();
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Slow dance</p>
          <h1 className="text-3xl font-light text-cream">{dancing ? 'Just us, and this song' : 'May I have this dance?'}</h1>
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto" role="radiogroup" aria-label="Where to dance">
          {ENVIRONMENTS.filter((e) => ['bedroom', 'rooftop', 'beach', 'stargazing', 'cafe'].includes(e.id)).map((e) => (
            <button key={e.id} role="radio" aria-checked={env === e.id} onClick={() => setEnv(e.id)} className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] transition ${env === e.id ? 'bg-surface-3 text-cream ring-1 ring-line-strong' : 'text-muted hover:text-cream'}`}>
              {e.emoji} {e.short}
            </button>
          ))}
        </div>
      </div>

      <DanceRoom dancing={dancing} environment={env}>
        <AnimatePresence>
          {!dancing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 flex flex-col items-center justify-end bg-gradient-to-t from-ink/85 via-ink/10 to-transparent pb-8">
              {outgoing?.type === 'dance' && outgoing.status === 'pending' ? (
                <p className="hand text-3xl text-cream" role="status">
                  Waiting for {w.them}…
                </p>
              ) : (
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => {
                    if (partnerStatus === 'offline') {
                      start('dance');
                      return;
                    }
                    invite('dance');
                  }}
                >
                  {partnerStatus === 'offline' ? 'Dance anyway (practice run)' : `Ask ${w.them} to dance ❤️`}
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DanceRoom>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <MiniPlayer className="flex-1" />
        <div className="flex gap-2">
          {call.status === 'idle' && (
            <Button icon={Video} onClick={() => call.join()}>
              Video bubbles
            </Button>
          )}
          {dancing ? (
            <Button variant="ghost" onClick={stop}>
              End the dance
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => navigate('/together')}>
              Back
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
