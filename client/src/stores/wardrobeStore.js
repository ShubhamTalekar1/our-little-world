import { createStore } from './createStore';
import { uid } from '../lib/id';
import { remote, api } from '../services/api/client';

export const useWardrobeStore = createStore('wardrobe', (set, get) => ({
  outfits: [],
  hydrate: (w) => set(w),

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
