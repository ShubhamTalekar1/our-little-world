import { createStore } from './createStore';
import { uid } from '../lib/id';
import { cleanText } from '../lib/sanitize';
import { realtime } from '../services/realtime';
import { EV } from '../services/realtime/events';
import { remote, api } from '../services/api/client';

export const useMemoryStore = createStore('memories', (set, get) => ({
  memories: [],
  hydrate: (memories) => set({ memories }),
  add({ image, scene, caption, date, location }, by) {
    const m = {
      id: uid('m'),
      image: image ?? null,
      scene: image ? null : scene ?? 'sunset',
      caption: cleanText(caption, 140),
      location: cleanText(location ?? '', 60),
      date: date ?? new Date().toISOString(),
      reactions: {},
      rotation: Math.round((Math.random() * 6 - 3) * 10) / 10,
      by,
    };
    set((s) => ({ memories: [...s.memories, m] }));
    realtime.emit(EV.MEMORY_ADDED, { memory: { ...m, image: image?.startsWith('data:') ? null : image } });
    remote(() => api.post('/memories', m));
    return m;
  },
  receive: (m) => set((s) => (s.memories.some((x) => x.id === m.id) ? s : { memories: [...s.memories, m] })),
  react(id, userId, emoji, broadcast = true) {
    set((s) => ({
      memories: s.memories.map((m) => {
        if (m.id !== id) return m;
        const reactions = { ...m.reactions };
        if (reactions[userId] === emoji) delete reactions[userId];
        else reactions[userId] = emoji;
        return { ...m, reactions };
      }),
    }));
    if (broadcast) {
      realtime.emit(EV.MEMORY_REACTION, { id, emoji });
      remote(() => api.post(`/memories/${id}/react`, { emoji }));
    }
  },
  update(id, patch) {
    set((s) => ({ memories: s.memories.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
    remote(() => api.patch(`/memories/${id}`, patch));
  },
  remove(id) {
    set((s) => ({ memories: s.memories.filter((m) => m.id !== id) }));
    remote(() => api.delete(`/memories/${id}`));
  },
  count: () => get().memories.length,
}));
