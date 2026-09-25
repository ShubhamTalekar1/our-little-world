import { createStore } from './createStore';
import { DEMO_MODE } from '../config/env';
import { seedPeople } from '../data/mockData';
import { remote, api } from '../services/api/client';

const empty = { me: null, partner: null, couple: null };

export const usePeopleStore = createStore('people', (set) => ({
  ...(DEMO_MODE ? seedPeople() : empty),
  hydrate: (data) => set({ me: data.me, partner: data.partner, couple: data.couple }),
  updateMe: (patch) => {
    set((s) => ({ me: { ...s.me, ...patch } }));
    remote(() => api.patch('/users/me', patch));
  },
  // Local nickname/pronouns for your person (how *you* see them).
  updatePartner: (patch) => set((s) => ({ partner: { ...s.partner, ...patch } })),
  updateCouple: (patch) => {
    set((s) => ({ couple: { ...s.couple, ...patch } }));
    remote(() => api.patch('/users/couple', patch));
  },
}));

export const useMe = () => usePeopleStore((s) => s.me);
export const usePartner = () => usePeopleStore((s) => s.partner);
