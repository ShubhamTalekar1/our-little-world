import { useShallow } from 'zustand/react/shallow';
import { createStore } from './createStore';
import { DEMO_MODE } from '../config/env';
import { seedGifts } from '../data/mockData';
import { GIFTS_BY_ID, MYSTERY_POOL } from '../catalog/gifts';
import { uid } from '../lib/id';
import { cleanText } from '../lib/sanitize';
import { realtime } from '../services/realtime';
import { EV } from '../services/realtime/events';
import { remote, api } from '../services/api/client';

export const useGiftStore = createStore('gifts', (set, get) => ({
  ...(DEMO_MODE ? seedGifts() : { received: [], sent: [] }),
  hydrate: (g) => set(g),

  /** Returns { ok, gift } or { ok: false, reason } */
  send(giftId, message, toId) {
    const gift = GIFTS_BY_ID[giftId];
    if (!gift) return { ok: false, reason: 'unknown' };
    const record = { id: uid('g'), giftId, to: toId, message: cleanText(message, 200), at: new Date().toISOString() };
    set((s) => ({ sent: [record, ...s.sent] }));
    realtime.emit(EV.GIFT_SENT, { id: record.id, giftId, message: record.message });
    remote(() => api.post('/gifts/send', { id: record.id, giftId, message: record.message }));
    return { ok: true, gift: record };
  },

  receive({ id, giftId, message, from, at }) {
    if (get().received.some((g) => g.id === id)) return null;
    const record = { id: id ?? uid('g'), giftId, from, message, at: at ?? new Date().toISOString(), opened: false };
    set((s) => ({ received: [record, ...s.received] }));
    return record;
  },

  /** Marks opened; resolves mystery gifts to a concrete item. */
  open(id) {
    const g = get().received.find((x) => x.id === id);
    if (!g) return null;
    let revealed = g.revealed ?? g.giftId;
    if (GIFTS_BY_ID[g.giftId]?.mystery && !g.revealed) revealed = MYSTERY_POOL[Math.floor(Math.random() * MYSTERY_POOL.length)];
    set((s) => ({ received: s.received.map((x) => (x.id === id ? { ...x, opened: true, revealed } : x)) }));
    realtime.emit(EV.GIFT_OPENED, { id });
    remote(() => api.post(`/gifts/${id}/open`, { revealed }));
    return { ...g, revealed };
  },
}));

export const useUnopenedGifts = () => useGiftStore(useShallow((s) => s.received.filter((g) => !g.opened)));
