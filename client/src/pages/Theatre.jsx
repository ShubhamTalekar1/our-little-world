import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Captions, Expand, Film, Maximize2, Minimize2, MessageCircle, Pause, Play, Ticket, X } from 'lucide-react';
import TicketCard from '../components/cinema/TicketCard';
import TrackMenu from '../components/cinema/TrackMenu';
import { useFilmTracks } from '../components/cinema/useFilmTracks';
import MoviePlayer from '../components/activities/MoviePlayer';
import ChatPanel from '../components/chat/ChatPanel';
import { useReactions, ReactionBurst } from '../components/activities/VideoCall';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import { useCinemaStore, filmFromShowing } from '../stores/cinemaStore';
import { usePeopleStore } from '../stores/peopleStore';
import { useAvatarStore } from '../stores/avatarStore';
import { usePresenceStore } from '../stores/presenceStore';
import { useActivityStore } from '../stores/activityStore';
import { useStoryStore } from '../stores/storyStore';
import { useSettingsStore } from '../stores/settingsStore';
import { toast } from '../stores/uiStore';
import { HOUSE_BY_KEY } from '../catalog/videos';
import { AVATAR_ME, AVATAR_HER } from '../data/defaultAvatars';
import { realtime } from '../services/realtime';
import { EV } from '../services/realtime/events';
import { FilmHost, FilmViewer } from '../services/rtc/filmStream';
import { getPoster } from '../lib/poster';
import { usePartnerWords } from '../lib/words';
import { playSfx } from '../services/audio/sfx';
import { FRIENDS } from '../config/features';
import { cn } from '../lib/cn';
import { hasWebGL } from '../components/avatar/chibi/stage';

const Cinema3D = lazy(() => import('../components/cinema/Cinema3D'));

const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

function useFilm(key) {
  const showings = useCinemaStore((s) => s.showings);
  return useMemo(() => {
    if (HOUSE_BY_KEY[key]) return HOUSE_BY_KEY[key];
    const s = showings.find((x) => x.id === key);
    return s ? filmFromShowing(s) : null;
  }, [key, showings]);
}

export default function Theatre() {
  const { key: rawKey } = useParams();
  const key = decodeURIComponent(rawKey);
  const navigate = useNavigate();
  const load = useCinemaStore((s) => s.load);
  const loaded = useCinemaStore((s) => s.loaded);
  const film = useFilm(key);
  const ticket = useCinemaStore((s) => s.tickets.find((t) => t.showingKey === key) ?? null);
  const partnerSeat = useCinemaStore((s) => s.partnerSeat(key));
  const getTicket = useCinemaStore((s) => s.getTicket);
  const checkIn = useCinemaStore((s) => s.checkIn);
  const me = usePeopleStore((s) => s.me);
  const partner = usePeopleStore((s) => s.partner);
  const avatars = useAvatarStore((s) => s.avatars);
  const partnerStatus = usePresenceStore((s) => s.partner.status);
  const invite = useActivityStore((s) => s.invite);
  const endActivity = useActivityStore((s) => s.end);
  const reducedPref = useSettingsStore((s) => s.reducedMotion);
  const w = usePartnerWords();
  const motionOn = reducedPref !== 'on';

  useEffect(() => {
    load();
  }, [load]);

  // ---- where each of us is --------------------------------------------------
  const [stage, setStage] = useState('lobby'); // lobby → checking → walking → seated
  const [enlarged, setEnlarged] = useState(false);
  const [theirStage, setTheirStage] = useState('away');
  const [cheer, setCheer] = useState({ me: false, them: false });
  const stageName = stage === 'seated' && enlarged ? 'screen' : stage;
  const stageRef = useRef(stageName);
  stageRef.current = stageName;

  useEffect(() => {
    realtime.emit(EV.THEATRE_STATE, { key, stage: stageName });
  }, [key, stageName]);
  useEffect(() => {
    realtime.emit(EV.THEATRE_STATE, {
      key,
      stage: stageRef.current,
      hello: true,
    });
    const off = realtime.on(EV.THEATRE_STATE, ({ key: k, stage: s, hello }) => {
      if (k !== key) {
        if (s !== 'away') setTheirStage('away');
        return;
      }
      setTheirStage(s);
      if (hello) realtime.emit(EV.THEATRE_STATE, { key, stage: stageRef.current });
    });
    const offline = realtime.on(EV.USER_OFFLINE, () => setTheirStage('away'));
    return () => {
      off();
      offline();
      realtime.emit(EV.THEATRE_STATE, { key, stage: 'away' });
    };
  }, [key]);
  useEffect(() => {
    if (partnerStatus === 'offline') setTheirStage('away');
  }, [partnerStatus]);

  // ---- who plays the film --------------------------------------------------------
  const mode = !film ? null : film.kind === 'stream' ? (film.hostId === me?.id ? 'host' : 'viewer') : film.kind === 'youtube' ? 'youtube' : 'html5';
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false); // the film has begun (screen shows it)
  const [fullLayout, setFullLayout] = useState(false); // enlarged: player on top, unwarped
  const [blocked, setBlocked] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const counted = useRef(false);
  const countFirstPlay = () => {
    if (counted.current) return;
    counted.current = true;
    useStoryStore.getState().inc('movies');
    useStoryStore.getState().recordFirst('first-movie', '🎬', 'First movie', `${film?.title}, together.`);
  };

  // Host: streams a file from this device.
  const hostVideo = useRef(null);
  const host = useRef(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileName, setFileName] = useState('');
  const [link, setLink] = useState(null); // WebRTC connection state
  const fileInput = useRef(null);
  useEffect(() => {
    if (mode !== 'host') return undefined;
    host.current = new FilmHost({ onState: setLink });
    return () => host.current?.destroy();
  }, [mode]);
  useEffect(() => () => fileUrl && URL.revokeObjectURL(fileUrl), [fileUrl]);

  // Viewer: receives the stream.
  const viewerVideo = useRef(null);
  const viewer = useRef(null);
  const [remote, setRemote] = useState(null);
  useEffect(() => {
    if (mode !== 'viewer') return undefined;
    viewer.current = new FilmViewer({ onStream: setRemote, onState: setLink });
    viewer.current.request();
    return () => viewer.current?.destroy();
  }, [mode]);
  // If the link drops, ask again.
  useEffect(() => {
    if (mode !== 'viewer' || !['failed', 'disconnected'].includes(link)) return undefined;
    const t = setTimeout(() => viewer.current?.request(), 2500);
    return () => clearTimeout(t);
  }, [mode, link]);
  // Ask for the film when we sit down, and whenever the host arrives.
  useEffect(() => {
    if (mode === 'viewer' && (stage === 'seated' || ['seated', 'screen'].includes(theirStage)) && !remote) viewer.current?.request();
  }, [mode, stage, theirStage, remote]);
  useEffect(() => {
    const v = viewerVideo.current;
    if (!v) return;
    v.srcObject = remote;
    if (remote) {
      v.play()
        .then(() => setBlocked(false))
        .catch((e) => e?.name === 'NotAllowedError' && setBlocked(true));
    }
  }, [remote]);

  // Synced players (YouTube / web links).
  const player = useRef(null);
  const pending = useRef(null);

  // Everyone hears about play / pause.
  useEffect(() => {
    const offs = [
      realtime.on(EV.MOVIE_PLAY, ({ key: k, position }) => {
        if (k && k !== key) return;
        if (mode === 'host') hostVideo.current?.play();
        else if (mode === 'viewer') setPlaying(true);
        else {
          player.current?.seek(position);
          player.current?.play();
          setPlaying(true);
        }
        toast(`${w.Subject} pressed play`, { emoji: '▶️' });
      }),
      realtime.on(EV.MOVIE_PAUSE, ({ key: k, position }) => {
        if (k && k !== key) return;
        if (mode === 'host') hostVideo.current?.pause();
        else if (mode === 'viewer') setPlaying(false);
        else {
          player.current?.pause();
          player.current?.seek(position);
          setPlaying(false);
        }
        toast(`${w.Subject} paused${position ? ` at ${fmt(position)}` : ''}`, {
          emoji: '⏸️',
        });
      }),
      realtime.on(EV.MOVIE_SEEK, ({ key: k, position }) => {
        if (k !== key || mode === 'host' || mode === 'viewer') return;
        player.current?.seek(position);
      }),
      realtime.on(EV.MOVIE_STATE, ({ key: k, position = 0, playing: p }) => {
        if (k !== key) return;
        if (mode === 'viewer') return setPlaying(!!p);
        if (mode === 'host' || !p) return;
        if (player.current) {
          player.current.seek(position);
          player.current.play();
        } else pending.current = { position, playing: p };
        setPlaying(true);
        toast(`Catching up with ${w.them} at ${fmt(position)}`, {
          emoji: '🎬',
        });
      }),
    ];
    return () => offs.forEach((o) => o());
  }, [key, mode, w.Subject, w.them]);

  // When they arrive, tell them where the film is.
  useEffect(() => {
    if (theirStage === 'away') return;
    if (mode === 'host') {
      const v = hostVideo.current;
      realtime.emit(EV.MOVIE_STATE, {
        key,
        position: v?.currentTime ?? 0,
        playing: v ? !v.paused : false,
      });
    } else if (mode === 'youtube' || mode === 'html5') {
      const p = player.current;
      if (p && !p.paused())
        realtime.emit(EV.MOVIE_STATE, {
          key,
          position: p.time(),
          playing: true,
        });
    }
  }, [theirStage === 'away', mode, key]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = () => {
    if (mode === 'host') {
      const v = hostVideo.current;
      if (!v?.src) return fileInput.current?.click();
      if (v.paused) v.play();
      else v.pause();
    } else if (mode === 'viewer') {
      // Ask the host: the film lives on their computer.
      realtime.emit(playing ? EV.MOVIE_PAUSE : EV.MOVIE_PLAY, { key });
      toast(playing ? `Asked ${w.them} to pause` : `Asked ${w.them} to play`, {
        emoji: playing ? '⏸️' : '▶️',
      });
    } else {
      // The player treats calls made through its API as remote (no echo), so
      // announce this press ourselves.
      const p = player.current;
      if (!p) return;
      const position = p.time();
      if (p.paused()) {
        p.play();
        setPlaying(true);
        countFirstPlay();
        realtime.emit(EV.MOVIE_PLAY, { key, position });
      } else {
        p.pause();
        setPlaying(false);
        realtime.emit(EV.MOVIE_PAUSE, { key, position });
      }
    }
  };

  // ---- audio tracks & subtitles ---------------------------------------------------
  const getVideo = useCallback(() => (mode === 'host' ? hostVideo.current : mode === 'html5' ? (player.current?.element?.() ?? null) : null), [mode]);
  const tracks = useFilmTracks({ filmKey: key, getVideo });
  const [trackMenu, setTrackMenu] = useState(false);

  // ---- ticket check ------------------------------------------------------------
  const [bubble, setBubble] = useState('');
  const [torn, setTorn] = useState(false);
  const [printing, setPrinting] = useState(false);
  const bubbleRef = useRef(null);
  useEffect(() => {
    if (stage !== 'lobby') return;
    setBubble(ticket ? 'Good evening! Ticket, please 🎟️' : 'Evening! You’ll need a ticket for this one.');
  }, [stage, ticket]);
  const handOver = async () => {
    setStage('checking');
    setBubble('Let’s see…');
    setTimeout(() => {
      setTorn(true);
      playSfx('tap');
      checkIn(ticket.id);
      const row = ticket.seat[0];
      const n = ticket.seat.slice(1);
      const next = ['seated', 'screen', 'walking'].includes(theirStage) ? ` ${w.Subject}’s already inside.` : '';
      setBubble(`Row ${row}, seat ${n}. Straight through the door and down the steps. Enjoy the film! 🍿${next}`);
    }, 900);
    setTimeout(() => setStage('walking'), 3600);
  };
  const buyHere = async () => {
    setPrinting(true);
    try {
      await getTicket(key, me?.id);
      playSfx('success');
    } catch (e) {
      toast(e.message, { emoji: '🎟️', tone: 'error' });
    } finally {
      setPrinting(false);
    }
  };

  // ---- reactions -----------------------------------------------------------------
  const reactions = useReactions(EV.MOVIE_REACTION);
  useEffect(
    () =>
      realtime.on(EV.MOVIE_REACTION, () => {
        setCheer((c) => ({ ...c, them: true }));
        setTimeout(() => setCheer((c) => ({ ...c, them: false })), 1600);
      }),
    [],
  );
  const react = (emoji) => {
    reactions.send(emoji);
    setCheer((c) => ({ ...c, me: true }));
    setTimeout(() => setCheer((c) => ({ ...c, me: false })), 1600);
  };

  // ---- posters for the lobby and the screen ---------------------------------------
  const films = useCinemaStore((s) => s.films);
  const [posterCanvas, setPosterCanvas] = useState(null);
  const [lobbyPosters, setLobbyPosters] = useState([]);
  useEffect(() => {
    if (!film) return;
    let live = true;
    getPoster(film).then((p) => live && setPosterCanvas(p.canvas));
    const others = films().slice(0, 3);
    Promise.all(others.map((f) => getPoster(f).then((p) => p.canvas))).then((c) => live && setLobbyPosters(c));
    return () => {
      live = false;
    };
  }, [film, films]);

  const [chatOpen, setChatOpen] = useState(false);
  useEffect(() => {
    if (playing) setStarted(true);
  }, [playing]);
  // Enlarging: the camera flies to the screen first (the film rides along on it),
  // then the player takes over the whole view.
  useEffect(() => {
    if (!enlarged) return setFullLayout(false);
    const t = setTimeout(() => setFullLayout(true), 950);
    return () => clearTimeout(t);
  }, [enlarged]);
  useEffect(() => {
    if (fullLayout && frame.current) {
      frame.current.style.transform = '';
      frame.current.style.visibility = 'visible';
    }
  }, [fullLayout]);
  const frame = useRef(null);
  const fullScreen = () => {
    const v = mode === 'host' ? hostVideo.current : mode === 'viewer' ? viewerVideo.current : null;
    if (frame.current?.requestFullscreen) frame.current.requestFullscreen().catch(() => {});
    else if (v?.webkitEnterFullscreen) v.webkitEnterFullscreen(); // iPhone
  };

  if (!loaded && !film) return <Spinner label="Opening the doors" />;
  if (!film)
    return (
      <div className="py-20 text-center">
        <p className="text-4xl" aria-hidden>
          🎞️
        </p>
        <h1 className="mt-3 font-display text-3xl text-cream">This film isn’t showing anymore</h1>
        <Button className="mt-6" onClick={() => navigate('/together/movie')}>
          See what’s on
        </Button>
      </div>
    );

  const seated = stage === 'seated';
  const view = stage === 'walking' ? 'walk' : seated ? (enlarged ? 'screen' : 'seats') : 'lobby';
  const theyAreHere = ['seated', 'screen', 'walking', 'lobby', 'checking'].includes(theirStage);
  const filmReady = mode === 'host' ? !!fileUrl : mode === 'viewer' ? !!remote : true;
  const showFilm = seated && filmReady && !loadError && (mode === 'viewer' ? !!remote : started);
  const status =
    mode === 'host'
      ? fileUrl
        ? theyAreHere
          ? link === 'connected'
            ? `Streaming to ${w.them} ✓`
            : `Connecting to ${w.them}…`
          : `${w.Subject} ${w.v('isn’t', 'aren’t')} here yet`
        : 'Choose the film file to start'
      : mode === 'viewer'
        ? remote
          ? `${w.Subject} ${w.v('is', 'are')} streaming this`
          : ['seated', 'screen'].includes(theirStage)
            ? `Waiting for ${w.Subject} to start the film…`
            : `${w.Subject} ${w.v('is', 'are')} bringing the film — wait for ${w.them} to take a seat`
        : playing
          ? 'Playing for both of you'
          : 'Press play when you’re both ready';

  const myConfig = avatars[me?.id] ?? AVATAR_ME;
  const theirConfig = avatars[partner?.id] ?? AVATAR_HER;

  return (
    <div className="relative -mx-3 h-[calc(100dvh-15rem)] min-h-[440px] overflow-hidden rounded-2xl bg-black sm:mx-0 sm:rounded-3xl lg:h-[calc(100dvh-7.5rem)]">
      {/* 3D cinema */}
      {hasWebGL() ? (
        <div className="absolute inset-0 z-10">
          <Suspense fallback={<div className="grid h-full place-items-center text-muted">Opening the doors…</div>}>
            <Cinema3D
              view={view}
              me={{
                config: myConfig,
                seat: ticket?.seat ?? 'F7',
                stage: stage === 'walking' ? 'walking' : seated ? 'seated' : 'lobby',
                cheer: cheer.me,
                pose: stage === 'checking' ? 'wave' : 'idle',
              }}
              partner={{
                config: partner ? theirConfig : null,
                seat: partnerSeat,
                stage: theirStage === 'screen' ? 'seated' : theirStage === 'checking' ? 'lobby' : theirStage,
                cheer: cheer.them,
              }}
              usherPose={stage === 'checking' && torn ? 'wave' : 'idle'}
              showFilm={showFilm}
              frameRef={frame}
              trackFrame={!fullLayout}
              poster={posterCanvas}
              posters={lobbyPosters}
              title={film.title}
              playing={seated && playing}
              curtainsOpen={seated && (filmReady || playing)}
              bubbleRef={bubbleRef}
              onArrive={() => {
                setStage('seated');
                playSfx('tap');
              }}
              motion={motionOn}
            />
          </Suspense>
        </div>
      ) : (
        <div className="grid h-full place-items-center bg-[radial-gradient(ellipse_at_center,#2a1a22,#07050a)] text-muted">Screen 1</div>
      )}

      {/* usher's speech bubble, pinned over his head */}
      {stage !== 'walking' && !seated && bubble && (
        <div ref={bubbleRef} className="pointer-events-none absolute z-10 w-max max-w-[min(18rem,70vw)] -translate-x-1/2 -translate-y-full" aria-live="polite">
          <motion.div key={bubble} initial={{ opacity: 0, y: 6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative rounded-2xl bg-cream px-4 py-2.5 text-sm text-ink shadow-soft">
            {bubble}
            <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-cream" aria-hidden />
          </motion.div>
        </div>
      )}

      {/* The film itself. In theatre view it sits behind the 3D scene, warped onto
          the screen, and shows through a see-through window in it. Enlarged, it
          comes to the front at full size. */}
      <div className={cn('absolute inset-0 overflow-hidden', fullLayout ? 'z-20 flex items-center justify-center bg-black' : 'pointer-events-none z-0')} aria-hidden={!fullLayout}>
        <div
          ref={frame}
          className={cn('bg-black [container-type:size]', fullLayout ? 'relative aspect-video max-h-full w-full' : 'absolute left-0 top-0 origin-top-left')}
          style={fullLayout ? undefined : { width: 1280, height: 720, visibility: 'hidden' }}
        >
          {mode === 'host' && (
            <video
              ref={hostVideo}
              src={fileUrl ?? undefined}
              playsInline
              controls={fullLayout}
              className="h-full w-full bg-black object-contain"
              onLoadedMetadata={tracks.refreshAudio}
              onLoadedData={(e) => {
                try {
                  host.current?.share(e.currentTarget);
                } catch (err) {
                  toast(err.message, { emoji: '📺', tone: 'error' });
                }
              }}
              onPlay={(e) => {
                setPlaying(true);
                countFirstPlay();
                realtime.emit(EV.MOVIE_PLAY, {
                  key,
                  position: e.currentTarget.currentTime,
                });
              }}
              onPause={(e) => {
                setPlaying(false);
                realtime.emit(EV.MOVIE_PAUSE, {
                  key,
                  position: e.currentTarget.currentTime,
                });
              }}
              onError={() => setLoadError('This file can’t be played in the browser. MP4 (H.264) or WebM work best.')}
              aria-label={film.title}
            />
          )}
          {mode === 'viewer' && <video ref={viewerVideo} playsInline autoPlay className="h-full w-full bg-black object-contain" aria-label={film.title} />}
          {(mode === 'youtube' || mode === 'html5') && (
            <MoviePlayer
              ref={player}
              controls={fullLayout}
              source={
                mode === 'youtube'
                  ? { kind: 'youtube', videoId: film.source, title: film.title }
                  : {
                      kind: 'html5',
                      id: film.key,
                      src: film.src ?? film.source,
                      title: film.title,
                    }
              }
              onReady={() => {
                tracks.refreshAudio();
                setLoadError(null);
                const p = pending.current;
                if (p) {
                  pending.current = null;
                  player.current?.seek(p.position);
                  if (p.playing) player.current?.play();
                }
              }}
              onPlay={(t) => {
                setPlaying(true);
                countFirstPlay();
                realtime.emit(EV.MOVIE_PLAY, { key, position: t });
              }}
              onPause={(t) => {
                setPlaying(false);
                realtime.emit(EV.MOVIE_PAUSE, { key, position: t });
              }}
              onSeek={(t) => realtime.emit(EV.MOVIE_SEEK, { key, position: t })}
              onError={(m) => setLoadError(m)}
              onBlocked={() => setBlocked(true)}
            />
          )}
          {/* subtitles: part of the picture, so they ride along onto the 3D screen and into full screen */}
          {tracks.showSubs && tracks.subText && (
            <div className="pointer-events-none absolute inset-x-0 bottom-[7%] z-10 flex justify-center px-[8%]" aria-live="polite">
              <p className="whitespace-pre-line rounded-lg bg-black/55 px-[0.6em] py-[0.15em] text-center font-medium leading-snug text-white" style={{ fontSize: 'clamp(13px, 4.2cqh, 44px)', textShadow: '0 1px 3px #000' }}>
                {tracks.subText}
              </p>
            </div>
          )}
          {loadError && seated && fullLayout && (
            <div className="absolute inset-0 grid place-items-center bg-ink/85 p-6 text-center">
              <div>
                <p className="text-3xl" aria-hidden>
                  🎞️
                </p>
                <p className="mt-2 text-cream">{loadError}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setLoadError(null);
          setFileName(f.name);
          tracks.setFile(f);
          setFileUrl(URL.createObjectURL(f));
          toast('Film loaded. Press play when you’re both seated', {
            emoji: '🎞️',
          });
        }}
      />

      {/* tap-to-start when the browser blocks sound */}
      {blocked && seated && (
        <button
          type="button"
          className="absolute inset-0 z-40 grid place-items-center bg-ink/60"
          onClick={() => {
            setBlocked(false);
            if (mode === 'viewer') viewerVideo.current?.play();
            else player.current?.play();
          }}
        >
          <span className="rounded-full bg-peach px-5 py-3 text-sm font-medium text-ink shadow-soft">▶ Tap to start the film</span>
        </button>
      )}

      <ReactionBurst items={reactions.items} />

      {/* top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 bg-gradient-to-b from-black/70 to-transparent p-3 sm:p-4">
        <div className="pointer-events-auto flex min-w-0 items-start gap-2">
          <button
            type="button"
            onClick={() => navigate('/together/movie')}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/40 text-cream ring-1 ring-white/10 hover:bg-black/60"
            aria-label="Back to Now Showing"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-lamp/80">Screen 1{ticket ? ` · Seat ${ticket.seat}` : ''}</p>
            <h1 className="truncate font-display text-lg text-cream sm:text-xl">{film.title}</h1>
            {seated && <p className="truncate text-xs text-cream-dim">{status}</p>}
          </div>
        </div>
        <div className="pointer-events-auto flex shrink-0 gap-2">
          {!theyAreHere && partnerStatus !== 'offline' && (
            <Button
              size="sm"
              variant="lavender"
              onClick={() =>
                invite('movie', {
                  title: film.title,
                  path: `/together/movie/${encodeURIComponent(key)}`,
                })
              }
            >
              Invite {w.them} 🍿
            </Button>
          )}
          <button
            type="button"
            onClick={() => setChatOpen((v) => !v)}
            aria-pressed={chatOpen}
            className="grid h-9 w-9 place-items-center rounded-full bg-black/40 text-cream ring-1 ring-white/10 hover:bg-black/60"
            aria-label="Chat"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              endActivity('movie');
              navigate('/together/movie');
            }}
            className="hidden h-9 items-center rounded-full bg-black/40 px-3 text-xs text-cream ring-1 ring-white/10 hover:bg-black/60 sm:flex"
          >
            Leave
          </button>
        </div>
      </div>

      {/* lobby: the ticket */}
      <AnimatePresence>
        {(stage === 'lobby' || stage === 'checking') && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-3 pt-10 sm:p-4"
          >
            <div className="mx-auto max-w-[19rem] sm:max-w-xs">
              {ticket ? (
                <>
                  <TicketCard ticket={ticket} holder={me?.name} torn={torn} compact />
                  {stage === 'lobby' && (
                    <Button variant="primary" size="md" icon={Ticket} className="mt-3 w-full" onClick={handOver} data-autofocus>
                      Hand over my ticket
                    </Button>
                  )}
                  {stage === 'checking' && torn && (
                    <Button variant="primary" size="md" className="mt-3 w-full" onClick={() => setStage('walking')}>
                      Find my seat
                    </Button>
                  )}
                </>
              ) : (
                <div className="rounded-2xl bg-surface/90 p-4 text-center ring-1 ring-line">
                  <p className="text-cream">No ticket yet for {film.title}.</p>
                  <Button variant="primary" icon={Ticket} className="mt-3" loading={printing} onClick={buyHere}>
                    Get my ticket
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* seated: controls */}
      <AnimatePresence>
        {seated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-2 bg-gradient-to-t from-black/80 to-transparent p-3 pt-12 sm:p-4 sm:pt-14"
          >
            {mode === 'host' && !fileUrl && (
              <Button variant="primary" icon={Film} onClick={() => fileInput.current?.click()}>
                Choose the film on this computer
              </Button>
            )}
            {mode === 'host' && fileUrl && <p className="max-w-full truncate text-[11px] text-cream-dim">🎞️ {fileName}</p>}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {(mode !== 'host' || fileUrl) && (mode !== 'viewer' || remote) && (
                <button type="button" onClick={togglePlay} className="grid h-11 w-11 place-items-center rounded-full bg-cream text-ink shadow-soft" aria-label={playing ? 'Pause' : 'Play'}>
                  {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
                </button>
              )}
              {['😂', '🥹', '😮', FRIENDS ? '👏' : '❤️', '🍿', '😱'].map((e) => (
                <motion.button
                  key={e}
                  type="button"
                  whileTap={{ scale: 0.8 }}
                  onClick={() => react(e)}
                  className="grid h-10 w-10 place-items-center rounded-full bg-black/40 text-lg ring-1 ring-white/10 hover:bg-black/60"
                  aria-label={`React ${e}`}
                >
                  {e}
                </motion.button>
              ))}
              <div className="relative">
                <button type="button" onClick={() => setTrackMenu((v) => !v)} aria-expanded={trackMenu} aria-haspopup="menu" className={cn('grid h-10 w-10 place-items-center rounded-full ring-1 ring-white/10 hover:bg-black/60', tracks.subText || tracks.subs ? 'bg-peach/25 text-peach' : 'bg-black/40 text-cream')} aria-label="Audio and subtitles">
                  <Captions className="h-4 w-4" />
                </button>
                <AnimatePresence>{trackMenu && <TrackMenu role={mode === 'host' ? 'host' : mode === 'viewer' ? 'viewer' : mode === 'youtube' ? 'youtube' : 'sync'} tracks={tracks} hostName={w.Subject} onClose={() => setTrackMenu(false)} />}</AnimatePresence>
              </div>
              {enlarged && (
                <button type="button" onClick={fullScreen} className="grid h-10 w-10 place-items-center rounded-full bg-black/40 text-cream ring-1 ring-white/10 hover:bg-black/60" aria-label="Full screen">
                  <Expand className="h-4 w-4" />
                </button>
              )}
              <Button size="sm" variant="soft" icon={enlarged ? Minimize2 : Maximize2} onClick={() => setEnlarged((v) => !v)}>
                {enlarged ? 'Theatre view' : 'Enlarge screen'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* chat drawer */}
      <AnimatePresence>
        {chatOpen && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 right-0 top-0 z-40 flex w-full max-w-sm flex-col bg-surface/95 backdrop-blur"
            aria-label="Chat"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-sm text-cream">Chat</p>
              <button type="button" onClick={() => setChatOpen(false)} className="rounded-full p-1.5 text-muted hover:bg-surface-2 hover:text-cream" aria-label="Close chat">
                <X className="h-4 w-4" />
              </button>
            </div>
            <ChatPanel compact className="flex-1" limit={60} />
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
