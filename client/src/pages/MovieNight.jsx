import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Film, Link2, FolderOpen, MessageCircle, Video, LogOut, RefreshCw } from 'lucide-react';
import MoviePlayer from '../components/activities/MoviePlayer';
import ChatPanel from '../components/chat/ChatPanel';
import { VideoBubbles, CallControls, useReactions, ReactionBurst } from '../components/activities/VideoCall';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import PresenceIndicator from '../components/presence/PresenceIndicator';
import { DEMO_VIDEOS } from '../catalog/videos';
import { realtime } from '../services/realtime';
import { EV } from '../services/realtime/events';
import { parseYouTubeId } from '../services/movie/youtube';
import { useCallStore } from '../stores/callStore';
import { useStoryStore } from '../stores/storyStore';
import { useActivityStore } from '../stores/activityStore';
import { usePresenceStore } from '../stores/presenceStore';
import { toast } from '../stores/uiStore';
import { usePartnerWords } from '../lib/words';
import { cn } from '../lib/cn';
import { FRIENDS, isEnabled } from '../config/features';

const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

function SourcePicker({ open, onClose, onPick }) {
  const [url, setUrl] = useState('');
  const fileRef = useRef(null);
  const w = usePartnerWords();
  return (
    <Modal open={open} onClose={onClose} title="What are we watching?" className="sm:max-w-2xl">
      <div className="grid grid-cols-2 gap-3">
        {DEMO_VIDEOS.map((v) => (
          <button key={v.id} onClick={() => onPick({ kind: 'html5', id: v.id, src: v.src, title: v.title })} className="group overflow-hidden rounded-2xl border border-line text-left transition hover:border-line-strong">
            <div className="grid aspect-video place-items-center" style={{ background: v.poster }}>
              <Film className="h-7 w-7 text-ink/50 transition group-hover:scale-110" aria-hidden />
            </div>
            <div className="p-3">
              <p className="text-sm text-cream">
                {v.title} <span className="text-faint">· {v.year}</span>
              </p>
              <p className="text-xs text-muted">{v.note}</p>
              <p className="mt-1 text-[10.5px] text-faint">{v.license}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const link = url.trim();
            const id = parseYouTubeId(link);
            if (id) return onPick({ kind: 'youtube', videoId: id, title: 'YouTube video' });
            if (/^https:\/\/\S+$/i.test(link)) {
              const name = decodeURIComponent(new URL(link).pathname.split('/').pop() || 'Video');
              return onPick({ kind: 'html5', id: `url:${link}`, src: link, title: name });
            }
            toast('Paste a YouTube link or a direct https video link', { emoji: '🔗', tone: 'error' });
          }}
          className="flex gap-2"
        >
          <label htmlFor="yt-url" className="sr-only">YouTube or video link</label>
          <input id="yt-url" className="field" placeholder="Paste a YouTube or video link" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button type="submit" icon={Link2} aria-label="Load link" />
        </form>
        <Button icon={FolderOpen} onClick={() => fileRef.current?.click()}>
          Use a file on this device
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick({ kind: 'html5', id: `local:${f.name}`, src: URL.createObjectURL(f), title: f.name, local: true });
          }}
        />
      </div>
      <p className="mt-3 text-xs text-muted">Files stay on your device — nothing is uploaded. {w.Subject} will be asked to pick {w.their} copy of the same film, then play and pause stay in sync.</p>
    </Modal>
  );
}

export default function MovieNight() {
  const [source, setSource] = useState({ kind: 'html5', ...DEMO_VIDEOS[0] });
  const [picking, setPicking] = useState(false);
  const [chat, setChat] = useState(true);
  const [sync, setSync] = useState({ state: 'waiting', at: 0 });
  const [loadError, setLoadError] = useState(null);
  const player = useRef(null);
  const stage = useRef(null);
  const counted = useRef(false);
  const call = useCallStore();
  const partnerActivity = usePresenceStore((s) => s.partner.activity);
  const partnerStatus = usePresenceStore((s) => s.partner.status);
  const invite = useActivityStore((s) => s.invite);
  const endActivity = useActivityStore((s) => s.end);
  const reactions = useReactions(EV.MOVIE_REACTION);
  const w = usePartnerWords();
  const navigate = useNavigate();
  const together = partnerStatus !== 'offline' && partnerActivity?.type === 'movie';
  const [blocked, setBlocked] = useState(false);
  const [theirFile, setTheirFile] = useState(null); // they're playing a file from their device
  const myFile = useRef(null);
  const picked = useRef(false); // did I choose this film myself?
  const pending = useRef(null); // playback to apply once a newly loaded film is ready

  // Whoever arrives second catches up with the film and position of the one already watching.
  useEffect(() => {
    if (!together) return;
    const p = player.current;
    realtime.emit(EV.MOVIE_STATE, {
      source: source.local ? { ...source, src: null } : source,
      position: p?.time() ?? 0,
      playing: p ? !p.paused() : false,
      picked: picked.current,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [together]);
  useEffect(
    () =>
      realtime.on(EV.MOVIE_STATE, ({ source: s, position = 0, playing, picked: theyPicked }) => {
        if (!s || !(playing || (theyPicked && !picked.current))) return;
        if (s.local) {
          setTheirFile(s.title);
          return;
        }
        const same = (s.id ?? s.videoId) === (source.id ?? source.videoId);
        if (same) {
          player.current?.seek(position);
          if (playing) player.current?.play();
        } else {
          pending.current = { position, playing };
          setSource(s);
        }
        setSync({ state: 'synced', at: position });
        toast(playing ? `Catching up with ${w.them} at ${fmt(position)}` : `${w.Subject} picked ${s.title}`, { emoji: '🎬' });
      }),
    [source, w.them, w.Subject],
  );
  const onReady = () => {
    setLoadError(null);
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    player.current?.seek(p.position);
    if (p.playing) player.current?.play();
  };

  // Apply the other person's playback actions.
  useEffect(() => {
    const offs = [
      realtime.on(EV.MOVIE_PLAY, ({ position }) => {
        player.current?.seek(position);
        player.current?.play();
        setSync({ state: 'synced', at: position });
        toast(`${w.Subject} pressed play`, { emoji: '▶️' });
      }),
      realtime.on(EV.MOVIE_PAUSE, ({ position }) => {
        player.current?.pause();
        player.current?.seek(position);
        setSync({ state: 'synced', at: position });
        toast(`${w.Subject} paused at ${fmt(position)}`, { emoji: '⏸️' });
      }),
      realtime.on(EV.MOVIE_SEEK, ({ position }) => {
        player.current?.seek(position);
        setSync({ state: 'synced', at: position });
      }),
      realtime.on(EV.MOVIE_LOAD, ({ source: s }) => {
        if (!s) return;
        if (s.local) {
          setTheirFile(s.title);
          return;
        }
        setTheirFile(null);
        setSource(s);
        toast(`${w.Subject} picked ${s.title}`, { emoji: '🎬' });
      }),
    ];
    return () => offs.forEach((o) => o());
  }, [w.Subject]);

  const pick = (s) => {
    picked.current = true;
    setLoadError(null);
    setSource(s);
    setPicking(false);
    setSync({ state: 'waiting', at: 0 });
    realtime.emit(EV.MOVIE_LOAD, { source: s.local ? { ...s, src: null } : s });
  };

  const onPlay = (t) => {
    setBlocked(false);
    realtime.emit(EV.MOVIE_PLAY, { position: t });
    setSync({ state: 'synced', at: t });
    if (!counted.current) {
      counted.current = true;
      useStoryStore.getState().inc('movies');
      useStoryStore.getState().recordFirst('first-movie', '🎬', 'First movie', `${source.title}, together.`);
    }
  };

  return (
    <div className="relative">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Movie night 🎬</p>
          <h1 className="font-display text-2xl text-cream">{source.title}</h1>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted">
            {together ? <span className="text-sage">{w.Theyre} here, watching with you</span> : <PresenceIndicator className="text-xs" />}
            <span className="flex items-center gap-1">
              <RefreshCw className={cn('h-3 w-3', sync.state === 'synced' ? 'text-sage' : 'text-faint')} aria-hidden />
              {sync.state === 'synced' ? `In sync · ${fmt(sync.at)}` : 'Press play when you’re both ready'}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!together && partnerStatus !== 'offline' && (
            <Button size="sm" variant="lavender" onClick={() => invite('movie', { title: source.title })}>
              Invite {w.them} 🍿
            </Button>
          )}
          <Button size="sm" icon={Film} onClick={() => setPicking(true)}>
            Change film
          </Button>
          {isEnabled('call') && call.status === 'idle' && (
            <Button size="sm" icon={Video} onClick={() => call.join()}>
              Add video bubbles
            </Button>
          )}
          <span className="hidden lg:block">
            <Button size="sm" variant="ghost" icon={MessageCircle} onClick={() => setChat((v) => !v)} aria-pressed={chat}>
              Chat
            </Button>
          </span>
          <Button
            size="sm"
            variant="ghost"
            icon={LogOut}
            onClick={() => {
              endActivity('movie');
              navigate('/together');
            }}
          >
            Leave
          </Button>
        </div>
      </div>

      <div className={cn('grid gap-4', chat && 'lg:grid-cols-[minmax(0,1fr)_340px]')}>
        <div ref={stage} className="relative">
          {/* the theatre: a soft screen-glow around the player */}
          <div className="pointer-events-none absolute -inset-6 rounded-[3rem] bg-[radial-gradient(ellipse_at_center,rgba(143,179,217,0.18),transparent_70%)] blur-2xl" aria-hidden />
          <div className="relative aspect-video overflow-hidden rounded-3xl bg-black shadow-soft ring-1 ring-line">
            <MoviePlayer key={source.id ?? source.videoId} ref={player} source={source} onPlay={onPlay} onPause={(t) => realtime.emit(EV.MOVIE_PAUSE, { position: t })} onSeek={(t) => realtime.emit(EV.MOVIE_SEEK, { position: t })} onError={(m) => setLoadError(m)} onReady={onReady} onBlocked={() => setBlocked(true)} />
            {theirFile && (
              <div className="absolute inset-x-3 top-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-ink/90 p-3 text-sm ring-1 ring-line">
                <span className="text-cream">
                  {w.Subject} is playing <span className="text-peach">{theirFile}</span> from {w.their} device.
                </span>
                <span className="flex gap-2">
                  <Button size="sm" variant="primary" icon={FolderOpen} onClick={() => myFile.current?.click()}>
                    Pick my copy
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setTheirFile(null)}>
                    Not now
                  </Button>
                </span>
                <input
                  ref={myFile}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    // Answering their pick: load quietly, sync continues with play/pause.
                    setSource({ kind: 'html5', id: `local:${f.name}`, src: URL.createObjectURL(f), title: f.name, local: true });
                    setTheirFile(null);
                    setLoadError(null);
                  }}
                />
              </div>
            )}
            {blocked && (
              <button
                type="button"
                className="absolute inset-0 z-10 grid place-items-center bg-ink/60 text-center"
                onClick={() => {
                  setBlocked(false);
                  player.current?.play();
                }}
              >
                <span className="rounded-full bg-peach px-5 py-3 text-sm font-medium text-ink shadow-soft">▶ {w.Subject} pressed play — tap to join</span>
              </button>
            )}
            {loadError && (
              <div className="absolute inset-0 z-20 grid place-items-center bg-ink/80 p-6 text-center">
                <div>
                  <p className="text-3xl" aria-hidden>🎞️</p>
                  <p className="mt-2 text-cream">{loadError}</p>
                  <p className="mt-1 text-sm text-muted">The sample films stream from the internet. Try another, a YouTube link, or a file on your device.</p>
                  <Button size="sm" variant="primary" className="mt-4" onClick={() => setPicking(true)}>
                    Choose something else
                  </Button>
                </div>
              </div>
            )}
            <ReactionBurst items={reactions.items} />
            <VideoBubbles containerRef={stage} className="bottom-16 right-4" />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1" role="group" aria-label="React">
              {['😂', '🥹', '😮', FRIENDS ? '👏' : '❤️', '🍿', '😱'].map((e) => (
                <motion.button key={e} whileTap={{ scale: 0.8 }} onClick={() => reactions.send(e)} className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-lg ring-1 ring-line hover:bg-surface-3" aria-label={`React ${e}`}>
                  {e}
                </motion.button>
              ))}
            </div>
            {call.status !== 'idle' && <CallControls onLeave={call.leave} />}
          </div>
        </div>
        <AnimatePresence>
          {chat && (
            <motion.aside initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="card hidden h-[min(70dvh,560px)] flex-col overflow-hidden lg:flex" aria-label="Chat">
              <ChatPanel compact className="flex-1" limit={60} />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
      {/* On phones the side chat doesn't fit, so it sits under the film. */}
      <div className="card mt-4 flex h-[340px] flex-col overflow-hidden lg:hidden" aria-label="Chat">
        <ChatPanel compact className="flex-1" limit={60} />
      </div>
      <SourcePicker open={picking} onClose={() => setPicking(false)} onPick={pick} />
    </div>
  );
}
