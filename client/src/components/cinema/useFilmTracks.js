import { useCallback, useEffect, useRef, useState } from 'react';
import { realtime } from '../../services/realtime';
import { EV } from '../../services/realtime/events';
import { cueAt, languageName, readSubtitleFile } from '../../lib/subtitles';
import { extractMkvSubtitles, isMatroska, readMkvInfo } from '../../lib/mkv';

/** Can this browser switch a video's audio track? (Safari yes; Chrome behind a flag.) */
export const canSwitchAudio = typeof HTMLMediaElement !== 'undefined' && 'audioTracks' in HTMLMediaElement.prototype;

/**
 * Audio tracks and subtitles for the film playing on *this* device.
 *
 * Whoever loads subtitles is their "owner": their device works out the line
 * on screen from its own playback and sends it to the other person, so it
 * shows on both screens — including the viewer of a streamed film, who has no
 * timeline of their own.
 */
export function useFilmTracks({ filmKey, getVideo }) {
  const [audio, setAudio] = useState([]); // from the browser: [{ id, label, enabled }]
  const [mkv, setMkv] = useState(null); // tracks listed inside an MKV file
  const [subs, setSubs] = useState(null); // { id, label, cues } — mine
  const [subText, setSubText] = useState('');
  const [showSubs, setShowSubs] = useState(true);
  const [progress, setProgress] = useState(null); // extracting embedded subtitles: 0…1
  const file = useRef(null);
  const cache = useRef(new Map());
  const abort = useRef(null);
  const mine = useRef(null);
  mine.current = subs;

  const refreshAudio = useCallback(() => {
    const list = getVideo()?.audioTracks;
    setAudio(list ? Array.from(list).map((t, i) => ({ id: t.id || String(i), label: t.label || languageName(t.language) || `Track ${i + 1}`, enabled: t.enabled })) : []);
  }, [getVideo]);

  const chooseAudio = (id) => {
    const list = getVideo()?.audioTracks;
    if (!list) return;
    Array.from(list).forEach((t, i) => {
      t.enabled = (t.id || String(i)) === id;
    });
    refreshAudio();
  };

  /** A new film file on this device: list what's inside it. */
  const setFile = useCallback(async (f) => {
    file.current = f;
    abort.current?.abort();
    cache.current.clear();
    setSubs(null);
    setMkv(null);
    setProgress(null);
    if (f && isMatroska(f)) {
      try {
        setMkv(await readMkvInfo(f));
      } catch {
        /* not readable: just play it */
      }
    }
  }, []);

  const loadSubtitleFile = async (f) => {
    const cues = await readSubtitleFile(f);
    setSubs({ id: `file:${f.name}`, label: f.name.replace(/\.[^.]+$/, ''), cues });
    setShowSubs(true);
  };

  const pickEmbedded = async (track) => {
    const id = `mkv:${track.number}`;
    if (cache.current.has(id)) {
      setSubs({ id, label: track.label, cues: cache.current.get(id) });
      setShowSubs(true);
      return;
    }
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    setProgress(0);
    try {
      const cues = await extractMkvSubtitles(file.current, track.number, { timecodeScale: mkv?.timecodeScale, codec: track.codec, onProgress: setProgress, signal: ctl.signal });
      cache.current.set(id, cues);
      if (!cues.length) throw new Error('That subtitle track is empty.');
      setSubs({ id, label: track.label, cues });
      setShowSubs(true);
    } finally {
      if (abort.current === ctl) setProgress(null);
    }
  };

  const subtitlesOff = () => {
    abort.current?.abort();
    setProgress(null);
    setSubs(null);
  };

  // Owner: follow my own playback and share the current line.
  useEffect(() => {
    if (!subs) return undefined;
    let last = null;
    const tick = () => {
      const v = getVideo();
      const text = v ? cueAt(subs.cues, v.currentTime) : '';
      if (text === last) return;
      last = text;
      setSubText(text);
      realtime.emit(EV.MOVIE_CUE, { key: filmKey, text });
    };
    tick();
    const t = setInterval(tick, 100);
    return () => {
      clearInterval(t);
      setSubText('');
      realtime.emit(EV.MOVIE_CUE, { key: filmKey, text: '' });
    };
  }, [subs, filmKey, getVideo]);

  // Everyone else: show the owner's line.
  useEffect(
    () =>
      realtime.on(EV.MOVIE_CUE, ({ key, text }) => {
        if (key === filmKey && !mine.current) setSubText(text ?? '');
      }),
    [filmKey],
  );

  return { audio, refreshAudio, chooseAudio, mkv, setFile, subs, loadSubtitleFile, pickEmbedded, subtitlesOff, subText, showSubs, setShowSubs, progress };
}
