import { createStore } from './createStore';
import { DEMO_MODE } from '../config/env';
import { seedPet } from '../data/mockData';
import { PET_FOODS } from '../catalog/pets';
import { cleanText } from '../lib/sanitize';
import { realtime } from '../services/realtime';
import { EV } from '../services/realtime/events';
import { remote, api } from '../services/api/client';

const clamp = (n) => Math.max(0, Math.min(100, n));
const HOUR = 3_600_000;

/** Tell the other person; `write` persists the change. */
function sync(pet, write) {
  const { log, ...rest } = pet;
  realtime.emit(EV.PET_UPDATE, { pet: rest });
  if (write) remote(write);
}

export const usePetStore = createStore('pet', (set, get) => ({
  pet: DEMO_MODE ? seedPet() : { adopted: false, log: [] },
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
    sync(pet, () => api.put('/rooms/pet', { adopted: true, species, name: pet.name }));
  },
  log(text) {
    set((s) => ({ pet: { ...s.pet, log: [{ at: new Date().toISOString(), text }, ...(s.pet.log ?? [])].slice(0, 20) } }));
  },
  feed(foodId, who = 'You') {
    const food = PET_FOODS.find((f) => f.id === foodId);
    if (!food) return { ok: false };
    set((s) => ({ pet: { ...s.pet, hunger: clamp(s.pet.hunger + food.hunger), happiness: clamp(s.pet.happiness + 4) } }));
    get().log(`${who} fed ${get().pet.name} ${food.emoji}`);
    sync(get().pet, () => api.post('/rooms/pet/feed', { food: foodId }));
    return { ok: true };
  },
  play(who = 'You') {
    set((s) => ({ pet: { ...s.pet, happiness: clamp(s.pet.happiness + 12), hunger: clamp(s.pet.hunger - 3) } }));
    get().log(`${who} played with ${get().pet.name}`);
    sync(get().pet, () => api.post('/rooms/pet/play'));
  },
  rename(name) {
    set((s) => ({ pet: { ...s.pet, name: cleanText(name, 24) || s.pet.name } }));
    sync(get().pet, () => api.put('/rooms/pet', { name: get().pet.name }));
  },
  setAccessory(id) {
    set((s) => ({ pet: { ...s.pet, accessory: id } }));
    sync(get().pet, () => api.put('/rooms/pet', { accessory: id }));
  },
  applyRemote: (pet) => set((s) => ({ pet: { ...s.pet, ...pet } })),
}));
