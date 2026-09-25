import { createStore } from './createStore';

export const useSettingsStore = createStore(
  'settings',
  (set) => ({
    soundEnabled: true,
    volume: 0.6,
    reducedMotion: 'system', // 'system' | 'on' | 'off'
    notifications: { gifts: true, messages: true, invitations: true, presence: true, reminders: true, letters: true },
    privacy: { showActivity: true, readReceipts: true, typingIndicator: true },
    simulatePartner: true, // demo mode only
    ambientRain: true,
    set: (patch) => set(patch),
    setNotification: (key, value) => set((s) => ({ notifications: { ...s.notifications, [key]: value } })),
    setPrivacy: (key, value) => set((s) => ({ privacy: { ...s.privacy, [key]: value } })),
  }),
  { alwaysPersist: true },
);
