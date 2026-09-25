import { createStore } from './createStore';
import { DEMO_MODE } from '../config/env';
import { seedCheckins } from '../data/mockData';
import { uid } from '../lib/id';
import { cleanText } from '../lib/sanitize';
import { isSameDay } from '../lib/time';
import { realtime } from '../services/realtime';
import { EV } from '../services/realtime/events';
import { remote, api } from '../services/api/client';

export const useCheckinStore = createStore('checkins', (set, get) => ({
  checkins: DEMO_MODE ? seedCheckins() : [],
  hydrate: (checkins) => set({ checkins }),
  checkIn(userId, mood, note) {
    const c = { id: uid('ci'), userId, mood, note: cleanText(note ?? '', 200), at: new Date().toISOString() };
    // One check-in per person per day: replace today's if it exists.
    set((s) => ({ checkins: [c, ...s.checkins.filter((x) => !(x.userId === userId && isSameDay(x.at, c.at)))] }));
    realtime.emit(EV.CHECKIN_NEW, { checkin: c });
    remote(() => api.post('/users/checkins', c));
    return c;
  },
  receive: (c) => set((s) => ({ checkins: [c, ...s.checkins.filter((x) => !(x.userId === c.userId && isSameDay(x.at, c.at)))] })),
  todayFor: (userId) => get().checkins.find((c) => c.userId === userId && isSameDay(c.at, Date.now())) ?? null,
}));
