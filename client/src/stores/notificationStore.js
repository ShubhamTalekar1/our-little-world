import { createStore } from './createStore';
import { uid } from '../lib/id';
import { remote, api } from '../services/api/client';

export const useNotificationStore = createStore('notifications', (set) => ({
  items: [],
  hydrate: (items) => set({ items }),
  push(n) {
    const item = { id: uid('n'), read: false, at: new Date().toISOString(), ...n };
    set((s) => ({ items: [item, ...s.items].slice(0, 60) }));
    return item;
  },
  markRead: (id) => {
    set((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
    remote(() => api.post(`/notifications/${id}/read`));
  },
  markAllRead: () => {
    set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) }));
    remote(() => api.post('/notifications/read-all'));
  },
  clear: () => set({ items: [] }),
}));

export const useUnreadCount = () => useNotificationStore((s) => s.items.filter((n) => !n.read).length);
