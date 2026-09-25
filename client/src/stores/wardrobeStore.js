import { createStore } from './createStore';
import { DEMO_MODE } from '../config/env';
import { seedWardrobe } from '../data/mockData';
import { CLOTHING_BY_ID } from '../catalog/avatarItems';
import { uid } from '../lib/id';
import { useWalletStore } from './walletStore';
import { remote, api } from '../services/api/client';

export const useWardrobeStore = createStore('wardrobe', (set, get) => ({
  ...(DEMO_MODE ? seedWardrobe() : { unlocked: [], outfits: [] }),
  hydrate: (w) => set(w),

  isOwned: (id) => (CLOTHING_BY_ID[id]?.price ?? 0) === 0 || get().unlocked.includes(id),

  unlock(id) {
    const item = CLOTHING_BY_ID[id];
    if (!item || get().isOwned(id)) return { ok: true };
    const ok = useWalletStore.getState().spend(item.price, `Unlocked ${item.name}`);
    if (!ok) return { ok: false, reason: 'coins' };
    set((s) => ({ unlocked: [...s.unlocked, id] }));
    remote(() => api.post('/wardrobe/unlock', { itemId: id }));
    return { ok: true };
  },

  saveOutfit(name, emoji, items) {
    const outfit = { id: uid('o'), name: name || 'New outfit', emoji: emoji || '✨', favorite: false, items };
    set((s) => ({ outfits: [outfit, ...s.outfits] }));
    remote(() => api.post('/wardrobe/outfits', outfit));
    return outfit;
  },
  renameOutfit(id, name) {
    set((s) => ({ outfits: s.outfits.map((o) => (o.id === id ? { ...o, name } : o)) }));
    remote(() => api.patch(`/wardrobe/outfits/${id}`, { name }));
  },
  updateOutfitItems(id, items) {
    set((s) => ({ outfits: s.outfits.map((o) => (o.id === id ? { ...o, items } : o)) }));
    remote(() => api.patch(`/wardrobe/outfits/${id}`, { items }));
  },
  toggleFavorite(id) {
    set((s) => ({ outfits: s.outfits.map((o) => (o.id === id ? { ...o, favorite: !o.favorite } : o)) }));
    const o = get().outfits.find((x) => x.id === id);
    remote(() => api.patch(`/wardrobe/outfits/${id}`, { favorite: o?.favorite }));
  },
  deleteOutfit(id) {
    set((s) => ({ outfits: s.outfits.filter((o) => o.id !== id) }));
    remote(() => api.delete(`/wardrobe/outfits/${id}`));
  },
}));
