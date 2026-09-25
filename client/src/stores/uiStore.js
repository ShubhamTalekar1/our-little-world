import { create } from 'zustand';
import { uid } from '../lib/id';

// Ephemeral UI state (never persisted): toasts, which modal is open, the
// currently playing avatar interaction, etc.
export const useUiStore = create((set, get) => ({
  toasts: [],
  toast: (message, { emoji, tone = 'default', duration = 3200, action } = {}) => {
    const id = uid('toast');
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, emoji, tone, action }] }));
    setTimeout(() => get().dismissToast(id), duration);
    return id;
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  // Gift opening modal
  openingGiftId: null,
  setOpeningGift: (id) => set({ openingGiftId: id }),

  // Gift sending animation overlay
  sendingGift: null,
  setSendingGift: (g) => set({ sendingGift: g }),

  // Current avatar interaction (drives poses + particles in any <Room/>)
  interaction: null, // { id, by: 'me' | 'partner', key }
  playInteraction: (id, by) => {
    const key = uid('ix');
    set({ interaction: { id, by, key } });
    setTimeout(() => {
      if (get().interaction?.key === key) set({ interaction: null });
    }, 3200);
  },

  mobileMoreOpen: false,
  setMobileMoreOpen: (v) => set({ mobileMoreOpen: v }),
  notificationsOpen: false,
  setNotificationsOpen: (v) => set({ notificationsOpen: v }),
}));

export const toast = (...args) => useUiStore.getState().toast(...args);
