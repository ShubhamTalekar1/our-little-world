import { createStore } from './createStore';
import { DEMO_MODE } from '../config/env';
import { seedCalendar } from '../data/mockData';
import { uid } from '../lib/id';
import { cleanText } from '../lib/sanitize';
import { realtime } from '../services/realtime';
import { EV } from '../services/realtime/events';
import { remote, api } from '../services/api/client';

export const EVENT_TYPES = [
  { id: 'date', label: 'Date night', emoji: '🌃' },
  { id: 'movie', label: 'Movie night', emoji: '🎬' },
  { id: 'call', label: 'Call', emoji: '❤️' },
  { id: 'birthday', label: 'Birthday', emoji: '🎂' },
  { id: 'anniversary', label: 'Anniversary', emoji: '💞' },
  { id: 'important', label: 'Important', emoji: '⭐' },
];

export const useCalendarStore = createStore('calendar', (set) => ({
  ...(DEMO_MODE ? seedCalendar() : { events: [], countdowns: [] }),
  remindersFired: [],
  hydrate: (c) => set(c),

  addEvent(e, broadcast = true) {
    const ev = { id: uid('e'), reminder: 15, note: '', ...e, title: cleanText(e.title, 80) || 'Plans', note: cleanText(e.note ?? '', 200) };
    set((s) => ({ events: [...s.events, ev] }));
    if (broadcast) {
      realtime.emit(EV.EVENT_CREATED, { event: ev });
      remote(() => api.post('/events', ev));
    }
    return ev;
  },
  receiveEvent: (ev) => set((s) => (s.events.some((x) => x.id === ev.id) ? s : { events: [...s.events, ev] })),
  removeEvent(id) {
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
    remote(() => api.delete(`/events/${id}`));
  },
  markReminderFired: (id) => set((s) => ({ remindersFired: [...s.remindersFired, id] })),

  addCountdown(c) {
    const cd = { id: uid('cd'), accent: 'peach', pinned: true, emoji: '⏳', ...c, title: cleanText(c.title, 60) || 'Until…' };
    set((s) => ({ countdowns: [...s.countdowns, cd] }));
    remote(() => api.post('/events/countdowns', cd));
    return cd;
  },
  removeCountdown(id) {
    set((s) => ({ countdowns: s.countdowns.filter((c) => c.id !== id) }));
    remote(() => api.delete(`/events/countdowns/${id}`));
  },
  togglePin: (id) => set((s) => ({ countdowns: s.countdowns.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)) })),
}));
