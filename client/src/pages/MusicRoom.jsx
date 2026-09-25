import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Heart, Plus, ListPlus, Users } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Tabs from '../components/ui/Tabs';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Toggle from '../components/ui/Toggle';
import MiniPlayer, { Equalizer, fmt, usePlaybackClock } from '../components/music/MiniPlayer';
import { SONGS } from '../catalog/songs';
import { useMusicStore } from '../stores/musicStore';
import { useSettingsStore } from '../stores/settingsStore';
import { usePresenceStore } from '../stores/presenceStore';
import { toast } from '../stores/uiStore';
import { usePartnerWords } from '../lib/words';
import { cn } from '../lib/cn';

function SongRow({ song, index, onAdd }) {
  const { currentId, playing, play, pause, favorites, toggleFavorite, playNext } = useMusicStore();
  const current = currentId === song.id;
  return (
    <motion.li initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className={cn('group flex items-center gap-3 rounded-2xl p-2 pr-3 transition hover:bg-surface-2', current && 'bg-surface-2')}>
      <button onClick={() => (current && playing ? pause() : play(song.id))} className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: `linear-gradient(135deg, ${song.color}, #2a2b3b)` }} aria-label={current && playing ? `Pause ${song.title}` : `Play ${song.title}`}>
        {current && playing ? <Equalizer playing color="#0e0f15" /> : <Play className="h-4 w-4 text-ink/80" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm', current ? 'text-peach' : 'text-cream')}>{song.title}</p>
        <p className="truncate text-xs text-muted">{song.artist}</p>
      </div>
      <span className="hidden text-xs tabular-nums text-faint sm:block">{fmt(song.duration)}</span>
      <button onClick={() => toggleFavorite(song.id)} className={cn('rounded-lg p-1.5', favorites.includes(song.id) ? 'text-rose' : 'text-faint hover:text-cream')} aria-label={favorites.includes(song.id) ? `Unfavourite ${song.title}` : `Favourite ${song.title}`} aria-pressed={favorites.includes(song.id)}>
        <Heart className="h-4 w-4" fill={favorites.includes(song.id) ? 'currentColor' : 'none'} />
      </button>
      <button
        onClick={() => {
          playNext(song.id);
          toast(`${song.title} plays next`, { emoji: '🎶' });
        }}
        className="rounded-lg p-1.5 text-faint hover:text-cream"
        aria-label={`Play ${song.title} next`}
      >
        <ListPlus className="h-4 w-4" />
      </button>
      <button onClick={() => onAdd(song)} className="rounded-lg p-1.5 text-faint hover:text-cream" aria-label={`Add ${song.title} to a playlist`}>
        <Plus className="h-4 w-4" />
      </button>
    </motion.li>
  );
}

export default function MusicRoom() {
  usePlaybackClock();
  const { playlists, favorites, queue, currentId, playing, playPlaylist, addToPlaylist, createPlaylist, together, setTogether, toggle } = useMusicStore();
  const sound = useSettingsStore((s) => s.soundEnabled);
  const partnerActivity = usePresenceStore((s) => s.partner.activity);
  const w = usePartnerWords();
  const [tab, setTab] = useState('library');
  const [adding, setAdding] = useState(null);
  const [newName, setNewName] = useState('');
  const current = SONGS.find((s) => s.id === currentId) ?? SONGS[0];

  const list = tab === 'library' ? SONGS : tab === 'favorites' ? SONGS.filter((s) => favorites.includes(s.id)) : queue.map((id) => SONGS.find((s) => s.id === id)).filter(Boolean);

  return (
    <div>
      <PageHeader eyebrow="Music room" title="Listen together" subtitle={partnerActivity?.type === 'music' ? `${w.Theyre} listening with you 🎶` : `Put something on. ${w.Subject}’ll hear it too.`}>
        <div className="flex items-center gap-2 rounded-2xl border border-line px-3">
          <Users className="h-4 w-4 text-muted" aria-hidden />
          <Toggle checked={together} onChange={setTogether} label="Shared playback" />
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <div className="card relative overflow-hidden p-6 text-center">
            <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 50% 30%, ${current.color}55, transparent 65%)` }} aria-hidden />
            <motion.div className="relative mx-auto grid h-44 w-44 place-items-center rounded-full shadow-soft" style={{ background: `repeating-radial-gradient(circle, #1a1a22 0 2px, #22222c 2px 4px)` }} animate={playing ? { rotate: 360 } : { rotate: 0 }} transition={playing ? { duration: 8, repeat: Infinity, ease: 'linear' } : { duration: 0.6 }}>
              <div className="h-16 w-16 rounded-full ring-4 ring-ink" style={{ background: current.color }} />
            </motion.div>
            <p className="relative mt-5 font-display text-xl text-cream">{current.title}</p>
            <p className="relative text-sm text-muted">{current.artist}</p>
            {!sound && <p className="relative mt-2 text-xs text-lamp">Sound is muted in settings</p>}
            <Button variant="primary" className="relative mt-4" onClick={toggle} icon={playing ? Pause : Play}>
              {playing ? 'Pause' : 'Play'}
            </Button>
          </div>
          <div className="card p-4">
            <p className="eyebrow mb-3">Playlists</p>
            <ul className="flex flex-col gap-1">
              {playlists.map((p) => (
                <li key={p.id}>
                  <button onClick={() => playPlaylist(p.id)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-surface-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface-3 text-lg" aria-hidden>
                      {p.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-cream">{p.name}</span>
                      <span className="text-xs text-muted">{p.songIds.length} songs</span>
                    </span>
                    <Play className="h-4 w-4 text-faint" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newName.trim()) return;
                createPlaylist(newName);
                toast(`Made “${newName}”`, { emoji: '🎶' });
                setNewName('');
              }}
            >
              <label htmlFor="new-pl" className="sr-only">New playlist name</label>
              <input id="new-pl" className="field py-2" placeholder="New playlist…" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Button type="submit" size="sm" icon={Plus} aria-label="Create playlist" />
            </form>
          </div>
        </div>

        <div className="min-w-0">
          <Tabs tabs={[{ id: 'library', label: 'Library', count: SONGS.length }, { id: 'favorites', label: 'Favorites', emoji: '♥', count: favorites.length }, { id: 'queue', label: 'Up next' }]} value={tab} onChange={setTab} layoutId="music-tabs" className="mb-4" />
          <ul className="flex flex-col gap-0.5">
            {list.map((s, i) => (
              <SongRow key={s.id} song={s} index={i} onAdd={setAdding} />
            ))}
          </ul>
          {list.length === 0 && <p className="py-10 text-center text-sm text-muted">Nothing here yet — tap ♥ on a song you love.</p>}
          <p className="mt-6 text-xs text-faint">These tracks are gentle generated arrangements, so they play without any streaming service. A real music provider can be plugged in behind the same player.</p>
        </div>
      </div>

      <MiniPlayer className="fixed inset-x-3 bottom-24 z-30 lg:hidden" />

      <Modal open={!!adding} onClose={() => setAdding(null)} title={`Add “${adding?.title}” to…`}>
        <ul className="flex flex-col gap-1">
          {playlists.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => {
                  addToPlaylist(p.id, adding.id);
                  toast(`Added to ${p.name}`, { emoji: p.emoji });
                  setAdding(null);
                }}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-surface-3"
              >
                <span aria-hidden>{p.emoji}</span>
                <span className="text-sm text-cream">{p.name}</span>
                {p.songIds.includes(adding?.id) && <span className="ml-auto text-xs text-muted">already there</span>}
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
