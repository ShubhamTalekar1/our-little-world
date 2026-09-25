import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, Heart } from 'lucide-react';
import { useMusicStore } from '../../stores/musicStore';
import { SONGS } from '../../catalog/songs';
import { cn } from '../../lib/cn';

export const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

/** Keeps the playback clock ticking and advances tracks at the end. */
export function usePlaybackClock() {
  const [, force] = useState(0);
  const playing = useMusicStore((s) => s.playing);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      const s = useMusicStore.getState();
      const song = SONGS.find((x) => x.id === s.currentId);
      if (song && s.position() >= song.duration) s.step(1);
      force((n) => n + 1);
    }, 500);
    return () => clearInterval(t);
  }, [playing]);
}

export function Equalizer({ playing, color = '#E8B4A0', className }) {
  return (
    <span className={cn('flex h-4 items-end gap-[2px]', className)} aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <motion.span key={i} className="w-[3px] rounded-full" style={{ background: color }} animate={playing ? { height: ['30%', '100%', '45%', '80%', '30%'] } : { height: '30%' }} transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }} />
      ))}
    </span>
  );
}

export default function MiniPlayer({ className }) {
  usePlaybackClock();
  const { currentId, playing, toggle, step, favorites, toggleFavorite, position } = useMusicStore();
  const song = SONGS.find((s) => s.id === currentId) ?? SONGS[0];
  const pos = position();
  return (
    <div className={cn('glass flex items-center gap-3 rounded-2xl p-2.5 pr-3', className)}>
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: `linear-gradient(135deg, ${song.color}, #2a2b3b)` }}>
        <Equalizer playing={playing} color="#0e0f15" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-cream">{song.title}</p>
        <div className="mt-1 flex items-center gap-2 text-[10.5px] tabular-nums text-muted">
          {fmt(pos)}
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
            <span className="block h-full rounded-full bg-peach" style={{ width: `${Math.min(100, (pos / song.duration) * 100)}%` }} />
          </span>
          {fmt(song.duration)}
        </div>
      </div>
      <button onClick={() => toggleFavorite(song.id)} className={cn('rounded-lg p-1.5', favorites.includes(song.id) ? 'text-rose' : 'text-faint hover:text-cream')} aria-label={favorites.includes(song.id) ? 'Remove from favourites' : 'Add to favourites'} aria-pressed={favorites.includes(song.id)}>
        <Heart className="h-4 w-4" fill={favorites.includes(song.id) ? 'currentColor' : 'none'} />
      </button>
      <button onClick={() => step(-1)} className="rounded-lg p-1.5 text-cream-dim hover:text-cream" aria-label="Previous song">
        <SkipBack className="h-4 w-4" />
      </button>
      <button onClick={toggle} className="grid h-9 w-9 place-items-center rounded-full bg-cream text-ink" aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
      </button>
      <button onClick={() => step(1)} className="rounded-lg p-1.5 text-cream-dim hover:text-cream" aria-label="Next song">
        <SkipForward className="h-4 w-4" />
      </button>
    </div>
  );
}
