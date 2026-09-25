import { create } from 'zustand';
import { realtime } from '../services/realtime';
import { EV } from '../services/realtime/events';
import { useSettingsStore } from './settingsStore';

/**
 * activity: { type: 'room' | 'movie' | 'dance' | 'avatar' | 'music' | 'chat' | 'date' | 'call' | 'letters' | 'memories' | 'gifts', detail? }
 */
export const usePresenceStore = create((set, get) => ({
  partner: { status: 'offline', activity: null, lastSeen: new Date(Date.now() - 25 * 60_000).toISOString() },
  me: { status: 'online', activity: { type: 'room' } },

  setPartner: (patch) => set((s) => ({ partner: { ...s.partner, ...patch } })),

  setMyActivity(activity) {
    const cur = get().me.activity;
    if (cur?.type === activity?.type && cur?.detail === activity?.detail) return;
    set((s) => ({ me: { ...s.me, activity } }));
    // Respect the privacy setting: they still see you're here, just not what you're doing.
    const share = useSettingsStore.getState().privacy.showActivity;
    realtime.emit(EV.PRESENCE_UPDATE, { status: 'online', activity: share ? activity : null });
  },
}));
