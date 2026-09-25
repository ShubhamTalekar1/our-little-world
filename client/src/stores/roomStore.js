import { createStore } from './createStore';
import { DEMO_MODE } from '../config/env';
import { seedRoom } from '../data/mockData';
import { FURNITURE_BY_ID } from '../catalog/furniture';
import { uid } from '../lib/id';
import { useWalletStore } from './walletStore';
import { realtime } from '../services/realtime';
import { EV } from '../services/realtime/events';
import { remote, api } from '../services/api/client';

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function sync(state) {
  const payload = { environment: state.environment, placed: state.placed };
  realtime.emit(EV.ROOM_UPDATE, payload);
  remote(() => api.put('/rooms/current', payload));
}

export const useRoomStore = createStore('room', (set, get) => ({
  ...(DEMO_MODE ? seedRoom() : { environment: 'bedroom', owned: ['plant', 'lamp', 'fairy'], placed: [] }),
  hydrate: (r) => set(r),
  applyRemote: ({ environment, placed }) => set((s) => ({ environment: environment ?? s.environment, placed: placed ?? s.placed })),

  setEnvironment(environment) {
    set({ environment });
    sync(get());
  },
  buy(id) {
    const f = FURNITURE_BY_ID[id];
    if (!f || get().owned.includes(id)) return { ok: true };
    if (!useWalletStore.getState().spend(f.price, `Bought ${f.name}`)) return { ok: false, reason: 'coins' };
    set((s) => ({ owned: [...s.owned, id] }));
    remote(() => api.post('/rooms/furniture', { itemId: id }));
    return { ok: true };
  },
  place(id) {
    const f = FURNITURE_BY_ID[id];
    const item = { uid: uid('r'), id, x: 30 + Math.random() * 40, y: f?.layer === 'wall' ? 25 : 80 };
    set((s) => ({ placed: [...s.placed, item] }));
    sync(get());
  },
  move(itemUid, x, y) {
    set((s) => ({ placed: s.placed.map((p) => (p.uid === itemUid ? { ...p, x: clamp(x, 2, 96), y: clamp(y, 8, 94) } : p)) }));
    sync(get());
  },
  remove(itemUid) {
    set((s) => ({ placed: s.placed.filter((p) => p.uid !== itemUid) }));
    sync(get());
  },
}));
