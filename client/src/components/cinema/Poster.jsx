import { useEffect, useState } from 'react';
import { getPoster, POSTER_PALETTES } from '../../lib/poster';
import { cn } from '../../lib/cn';

/** A painted film poster (2:3). */
export default function Poster({ film, className, onCanvas }) {
  const [art, setArt] = useState(null);
  useEffect(() => {
    let live = true;
    getPoster(film).then((p) => {
      if (!live) return;
      setArt(p.url);
      onCanvas?.(p.canvas);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [film.title, film.tagline, film.genre, film.palette, film.poster, film.startsAt]);
  const [a, b] = POSTER_PALETTES[(film.palette ?? 0) % POSTER_PALETTES.length];
  return (
    <div className={cn('relative aspect-[2/3] overflow-hidden rounded-xl bg-surface-2', className)} style={art ? undefined : { background: `linear-gradient(180deg, ${a}, ${b})` }}>
      {art && <img src={art} alt={`${film.title} poster`} className="h-full w-full object-cover" draggable={false} />}
    </div>
  );
}
