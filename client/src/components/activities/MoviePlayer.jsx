import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { loadYouTubeApi } from '../../services/movie/youtube';

/**
 * One player interface for any source:
 *   play() pause() seek(t) time() paused()
 * and callbacks onPlay/onPause/onSeek(t) fired ONLY for local user actions.
 * Remote-applied changes are suppressed so sync events never echo.
 */
const MoviePlayer = forwardRef(function MoviePlayer({ source, onPlay, onPause, onSeek, onReady, onError, onBlocked }, ref) {
  const video = useRef(null);
  const yt = useRef(null);
  const ytHost = useRef(null);
  const suppress = useRef(0);
  const lastTime = useRef(0);

  const guard = (fn) => {
    suppress.current = Date.now() + 700;
    fn();
  };
  const local = () => Date.now() > suppress.current;

  useImperativeHandle(ref, () => ({
    // Browsers can refuse to start playback that wasn't started by a tap (autoplay rules).
    play: () => guard(() => (source.kind === 'youtube' ? yt.current?.playVideo() : video.current?.play().catch((e) => e?.name === 'NotAllowedError' && onBlocked?.()))),
    pause: () => guard(() => (source.kind === 'youtube' ? yt.current?.pauseVideo() : video.current?.pause())),
    seek: (t) => guard(() => (source.kind === 'youtube' ? yt.current?.seekTo(t, true) : video.current && (video.current.currentTime = t))),
    time: () => (source.kind === 'youtube' ? yt.current?.getCurrentTime?.() ?? 0 : video.current?.currentTime ?? 0),
    paused: () => (source.kind === 'youtube' ? yt.current?.getPlayerState?.() !== 1 : video.current?.paused ?? true),
    element: () => video.current,
  }));

  // YouTube source
  useEffect(() => {
    if (source.kind !== 'youtube') return;
    let player;
    let poll;
    loadYouTubeApi()
      .then((YT) => {
        player = new YT.Player(ytHost.current, {
          videoId: source.videoId,
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onReady: () => onReady?.(),
            onStateChange: (e) => {
              if (!local()) return;
              if (e.data === YT.PlayerState.PLAYING) onPlay?.(player.getCurrentTime());
              if (e.data === YT.PlayerState.PAUSED) onPause?.(player.getCurrentTime());
            },
          },
        });
        yt.current = player;
        // The YT API has no "seeked" event: detect jumps.
        poll = setInterval(() => {
          const t = player.getCurrentTime?.() ?? 0;
          if (Math.abs(t - lastTime.current) > 2.5 && local()) onSeek?.(t);
          lastTime.current = t;
        }, 1000);
      })
      .catch((e) => onError?.(e.message));
    return () => {
      clearInterval(poll);
      player?.destroy?.();
      yt.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source.kind, source.videoId]);

  if (source.kind === 'youtube') {
    return (
      <div className="h-full w-full">
        <div ref={ytHost} className="h-full w-full" />
      </div>
    );
  }
  return (
    <video
      ref={video}
      src={source.src}
      controls
      playsInline
      preload="metadata"
      className="h-full w-full bg-black object-contain"
      onPlay={(e) => local() && onPlay?.(e.currentTarget.currentTime)}
      onPause={(e) => local() && !e.currentTarget.seeking && onPause?.(e.currentTarget.currentTime)}
      onSeeked={(e) => local() && onSeek?.(e.currentTarget.currentTime)}
      onLoadedMetadata={() => onReady?.()}
      onError={() => onError?.('This video couldn’t be loaded')}
      aria-label={source.title}
    />
  );
});

export default MoviePlayer;
