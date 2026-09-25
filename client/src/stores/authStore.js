import { createStore } from './createStore';
import { DEMO_MODE } from '../config/env';
import { api, setTokenGetter } from '../services/api/client';

/**
 * status: 'new'        → first launch, show onboarding
 *         'signedOut'  → show login
 *         'ready'      → inside the world
 */
export const useAuthStore = createStore(
  'auth',
  (set, get) => ({
    status: DEMO_MODE ? 'new' : 'signedOut',
    token: null,
    userId: null,
    error: null,
    loading: false,

    completeOnboarding: (userId) => set({ status: 'ready', userId }),

    async login(email, password) {
      set({ loading: true, error: null });
      try {
        if (DEMO_MODE) {
          await new Promise((r) => setTimeout(r, 500));
          set({ status: 'ready', userId: 'u_me', loading: false });
          return true;
        }
        const res = await api.post('/auth/login', { email, password });
        set({ status: 'ready', token: res.token, userId: res.user.id, loading: false });
        return true;
      } catch (e) {
        set({ error: e.message, loading: false });
        return false;
      }
    },

    async register({ name, email, password, inviteCode }) {
      set({ loading: true, error: null });
      try {
        if (DEMO_MODE) {
          await new Promise((r) => setTimeout(r, 400));
          set({ loading: false });
          return { ok: true };
        }
        const res = await api.post('/auth/register', { name, email, password, inviteCode: inviteCode || undefined });
        set({ token: res.token, userId: res.user.id, loading: false });
        return { ok: true, user: res.user, couple: res.couple };
      } catch (e) {
        set({ error: e.message, loading: false });
        return { ok: false, error: e.message };
      }
    },

    logout() {
      if (!DEMO_MODE) api.post('/auth/logout').catch(() => {});
      set({ status: 'signedOut', token: null, error: null });
    },
  }),
  { alwaysPersist: true, partialize: (s) => ({ status: s.status, token: s.token, userId: s.userId }) },
);

setTokenGetter(() => useAuthStore.getState().token);
