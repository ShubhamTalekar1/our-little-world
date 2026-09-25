import { createStore } from './createStore';
import { uid } from '../lib/id';
import { cleanText } from '../lib/sanitize';
import { remote, api } from '../services/api/client';

/** Milestones for "Our Story", plus shared counters used for achievements. */
export const useStoryStore = createStore('story', (set, get) => ({
  milestones: [],
  stats: { movies: 0, dances: 0, dates: 0, hugs: 0, messagesBase: 0 },
  unlocked: {}, // achievementId → ISO date
  hydrate: (s) => set(s),

  addMilestone(m) {
    const ms = { id: uid('ms'), kind: 'manual', emoji: '✨', ...m, title: cleanText(m.title, 80), note: cleanText(m.note ?? '', 240) };
    set((s) => ({ milestones: [...s.milestones, ms] }));
    remote(() => api.post('/activities/milestones', ms));
    return ms;
  },
  removeMilestone(id) {
    set((s) => ({ milestones: s.milestones.filter((m) => m.id !== id) }));
    remote(() => api.delete(`/activities/milestones/${id}`));
  },

  /** Record a "first" automatically, once. */
  recordFirst(key, emoji, title, note) {
    if (get().milestones.some((m) => m.autoKey === key || m.title === title)) return;
    get().addMilestone({ autoKey: key, emoji, title, note, date: new Date().toISOString(), kind: 'auto' });
  },

  inc(key, by = 1) {
    set((s) => ({ stats: { ...s.stats, [key]: (s.stats[key] ?? 0) + by } }));
    remote(() => api.post('/activities/stats', { key, by }));
  },
  markUnlocked: (id) => set((s) => ({ unlocked: { ...s.unlocked, [id]: new Date().toISOString() } })),
}));
