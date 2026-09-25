import { createStore } from './createStore';
import { DEMO_MODE } from '../config/env';
import { initialAvatars, ME_ID } from '../data/demoWorld';
import { OUTFIT_SLOTS } from '../catalog/avatarItems';
import { realtime } from '../services/realtime';
import { EV } from '../services/realtime/events';
import { remote, api } from '../services/api/client';

let pushTimer;
function broadcast(config) {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    realtime.emit(EV.AVATAR_UPDATE, { avatar: config });
    remote(() => api.put('/avatars/me', { config }));
  }, 900);
}

export const useAvatarStore = createStore('avatars', (set, get) => ({
  myId: ME_ID,
  avatars: DEMO_MODE ? initialAvatars() : {},
  hydrate: (myId, avatars) => set({ myId, avatars }),
  setAvatar: (userId, config) => set((s) => ({ avatars: { ...s.avatars, [userId]: config } })),

  mine: () => get().avatars[get().myId],
  updateMine(patch) {
    const next = { ...get().mine(), ...patch };
    set((s) => ({ avatars: { ...s.avatars, [s.myId]: next } }));
    broadcast(next);
  },
  equip(slot, itemId) {
    const cur = get().mine();
    const outfit = { ...cur.outfit, [slot]: itemId };
    if (slot === 'dress') {
      delete outfit.top;
      delete outfit.bottom;
    }
    if (slot === 'top' || slot === 'bottom') delete outfit.dress;
    get().updateMine({ outfit });
  },
  unequip(slot) {
    const outfit = { ...get().mine().outfit };
    delete outfit[slot];
    get().updateMine({ outfit });
  },
  /** Replace the whole outfit (saved outfits, themed looks). */
  wearOutfit(items) {
    const outfit = {};
    OUTFIT_SLOTS.forEach((slot) => {
      if (items[slot]) outfit[slot] = items[slot];
    });
    get().updateMine({ outfit });
  },
}));

export const useMyAvatar = () => useAvatarStore((s) => s.avatars[s.myId]);
export const useAvatarOf = (userId) => useAvatarStore((s) => s.avatars[userId]);
