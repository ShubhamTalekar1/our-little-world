import { createStore } from './createStore';
import { DEMO_MODE } from '../config/env';
import { seedMusic } from '../data/mockData';
import { SONGS } from '../catalog/songs';
import { uid } from '../lib/id';
import { cleanText } from '../lib/sanitize';
import { realtime } from '../services/realtime';
import { EV } from '../services/realtime/events';
import { musicEngine } from '../services/audio/synth';
import { useSettingsStore } from './settingsStore';

const songById = (id) => SONGS.find((s) => s.id === id);

/**
 * Playback clock: position = offset + (now - startedAt) while playing.
 * Shared playback sends the clock to the other person, who follows it.
 */
export const useMusicStore = createStore(
  'music',
  (set, get) => ({
    ...(DEMO_MODE ? seedMusic() : { playlists: [], favorites: [], queue: SONGS.map((s) => s.id) }),
    currentId: 's1',
    playing: false,
    startedAt: 0,
    offset: 0,
    together: true,

    position() {
      const s = get();
      return s.playing ? s.offset + (Date.now() - s.startedAt) / 1000 : s.offset;
    },
    current: () => songById(get().currentId),

    _engine() {
      const s = get();
      const muted = !useSettingsStore.getState().soundEnabled;
      if (s.playing && !muted) musicEngine.play(songById(s.currentId), useSettingsStore.getState().volume);
      else musicEngine.stop();
    },
    _broadcast(event) {
      if (!get().together) return;
      realtime.emit(event, { songId: get().currentId, position: get().position() });
    },

    play(id) {
      const next = id ?? get().currentId;
      const changed = next !== get().currentId;
      set({ currentId: next, playing: true, startedAt: Date.now(), offset: changed ? 0 : get().offset });
      get()._engine();
      get()._broadcast(changed ? EV.MUSIC_TRACK : EV.MUSIC_PLAY);
    },
    pause() {
      set({ offset: get().position(), playing: false });
      get()._engine();
      get()._broadcast(EV.MUSIC_PAUSE);
    },
    toggle() {
      get().playing ? get().pause() : get().play();
    },
    seek(sec) {
      set({ offset: sec, startedAt: Date.now() });
      get()._broadcast(EV.MUSIC_PLAY);
    },
    step(dir = 1) {
      const q = get().queue;
      const i = q.indexOf(get().currentId);
      const next = q[(i + dir + q.length) % q.length];
      set({ currentId: next, offset: 0, startedAt: Date.now(), playing: true });
      get()._engine();
      get()._broadcast(EV.MUSIC_TRACK);
    },
    /** Follow the other person's clock (no re-broadcast). */
    applyRemote({ songId, position, playing }) {
      set({ currentId: songId ?? get().currentId, offset: position ?? 0, startedAt: Date.now(), playing });
      get()._engine();
    },
    stopLocal() {
      set({ offset: get().position(), playing: false });
      musicEngine.stop();
    },

    enqueue: (id) => set((s) => ({ queue: [...s.queue.filter((x) => x !== id), id] })),
    playNext: (id) =>
      set((s) => {
        const q = s.queue.filter((x) => x !== id);
        q.splice(q.indexOf(s.currentId) + 1, 0, id);
        return { queue: q };
      }),
    toggleFavorite: (id) => set((s) => ({ favorites: s.favorites.includes(id) ? s.favorites.filter((x) => x !== id) : [...s.favorites, id] })),
    addToPlaylist: (plId, songId) =>
      set((s) => ({ playlists: s.playlists.map((p) => (p.id === plId && !p.songIds.includes(songId) ? { ...p, songIds: [...p.songIds, songId] } : p)) })),
    createPlaylist: (name, emoji = '🎶') => {
      const pl = { id: uid('pl'), name: cleanText(name, 40) || 'New playlist', emoji, songIds: [] };
      set((s) => ({ playlists: [...s.playlists, pl] }));
      return pl;
    },
    playPlaylist(plId) {
      const pl = get().playlists.find((p) => p.id === plId);
      if (!pl?.songIds.length) return;
      set({ queue: [...pl.songIds, ...SONGS.map((s) => s.id).filter((x) => !pl.songIds.includes(x))] });
      get().play(pl.songIds[0]);
    },
    setTogether: (together) => set({ together }),
  }),
  { partialize: (s) => ({ playlists: s.playlists, favorites: s.favorites, queue: s.queue, currentId: s.currentId, together: s.together }) },
);
