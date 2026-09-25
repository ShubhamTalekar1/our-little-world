import { createStore } from './createStore';
import { DEMO_MODE } from '../config/env';
import { seedPet } from '../data/mockData';
import { PET_FOODS, PET_ACCESSORIES } from '../catalog/pets';
import { cleanText } from '../lib/sanitize';
import { useWalletStore } from './walletStore';
import { realtime } from '../services/realtime';
import { EV } from '../services/realtime/events';
import { remote, api } from '../services/api/client';

const clamp = (n) => Math.max(0, Math.min(100, n));
const HOUR = 3_600_000;

function sync(pet) {
  const { log, ...rest } = pet;
  realtime.emit(EV.PET_UPDATE, { pet: rest });
  remote(() => api.put('/rooms/pet', rest));
}

export const usePetStore = createStore('pet', (set, get) => ({
  pet: DEMO_MODE ? seedPet() : { adopted: false, ownedAccessories: ['none', 'bow'], log: [] },
  hydrate: (pet) => set({ pet }),

  /** Gently decay stats based on elapsed time (≈3 hunger / hour). */
  tick() {
    const p = get().pet;
    if (!p.adopted) return;
    const hours = (Date.now() - new Date(p.lastTick).getTime()) / HOUR;
    if (hours < 0.05) return;
    set({ pet: { ...p, hunger: clamp(p.hunger - hours * 3), happiness: clamp(p.happiness - hours * 2), lastTick: new Date().toISOString() } });
  },
  adopt(species, name) {
    const pet = { ...get().pet, adopted: true, species, name: cleanText(name, 24) || 'Mochi', accessory: 'bow', hunger: 80, happiness: 90, lastTick: new Date().toISOString(), log: [] };
    set({ pet });
    sync(pet);
  },
  log(text) {
    set((s) => ({ pet: { ...s.pet, log: [{ at: new Date().toISOString(), text }, ...(s.pet.log ?? [])].slice(0, 20) } }));
  },
  feed(foodId, who = 'You') {
    const food = PET_FOODS.find((f) => f.id === foodId);
    if (!food) return { ok: false };
    if (!useWalletStore.getState().spend(food.price, `${food.name} for ${get().pet.name}`)) return { ok: false, reason: 'coins' };
    set((s) => ({ pet: { ...s.pet, hunger: clamp(s.pet.hunger + food.hunger), happiness: clamp(s.pet.happiness + 4) } }));
    get().log(`${who} fed ${get().pet.name} ${food.emoji}`);
    sync(get().pet);
    return { ok: true };
  },
  play(who = 'You') {
    set((s) => ({ pet: { ...s.pet, happiness: clamp(s.pet.happiness + 12), hunger: clamp(s.pet.hunger - 3) } }));
    get().log(`${who} played with ${get().pet.name}`);
    sync(get().pet);
  },
  rename(name) {
    set((s) => ({ pet: { ...s.pet, name: cleanText(name, 24) || s.pet.name } }));
    sync(get().pet);
  },
  setAccessory(id) {
    set((s) => ({ pet: { ...s.pet, accessory: id } }));
    sync(get().pet);
  },
  buyAccessory(id) {
    const acc = PET_ACCESSORIES.find((a) => a.id === id);
    if (!acc || get().pet.ownedAccessories.includes(id)) return { ok: true };
    if (!useWalletStore.getState().spend(acc.price, `${acc.name} for ${get().pet.name}`)) return { ok: false, reason: 'coins' };
    set((s) => ({ pet: { ...s.pet, ownedAccessories: [...s.pet.ownedAccessories, id], accessory: id } }));
    sync(get().pet);
    return { ok: true };
  },
  applyRemote: (pet) => set((s) => ({ pet: { ...s.pet, ...pet } })),
}));
