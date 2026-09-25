import { createStore } from './createStore';
import { DEMO_MODE } from '../config/env';
import { initialRoom } from '../data/demoWorld';
import { FURNITURE_BY_ID } from '../catalog/furniture';
import { uid } from '../lib/id';
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
  ...(DEMO_MODE ? initialRoom() : { environment: 'bedroom', placed: [] }),
  hydrate: (r) => set(r),
  applyRemote: ({ environment, placed }) => set((s) => ({ environment: environment ?? s.environment, placed: placed ?? s.placed })),

  setEnvironment(environment) {
    set({ environment });
    sync(get());
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
