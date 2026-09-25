import { createStore } from './createStore';
import { DEMO_MODE } from '../config/env';
import { seedWallet } from '../data/mockData';
import { uid } from '../lib/id';
import { isSameDay } from '../lib/time';
import { remote, api } from '../services/api/client';

export const DAILY_REWARD = 50;

export const useWalletStore = createStore('wallet', (set, get) => ({
  ...(DEMO_MODE ? seedWallet() : { balance: 0, transactions: [], lastDailyClaim: null }),
  hydrate: (w) => set(w),

  canAfford: (amount) => get().balance >= amount,

  /** Returns false (and changes nothing) if there aren't enough coins. */
  spend(amount, reason) {
    if (get().balance < amount) return false;
    set((s) => ({
      balance: s.balance - amount,
      transactions: [{ id: uid('t'), amount: -amount, reason, at: new Date().toISOString() }, ...s.transactions].slice(0, 100),
    }));
    return true;
  },

  earn(amount, reason) {
    set((s) => ({
      balance: s.balance + amount,
      transactions: [{ id: uid('t'), amount, reason, at: new Date().toISOString() }, ...s.transactions].slice(0, 100),
    }));
  },

  canClaimDaily: () => !get().lastDailyClaim || !isSameDay(get().lastDailyClaim, Date.now()),
  claimDaily() {
    if (!get().canClaimDaily()) return false;
    get().earn(DAILY_REWARD, 'Daily hello');
    set({ lastDailyClaim: new Date().toISOString() });
    remote(() => api.post('/wallet/daily'));
    return true;
  },
}));
