import { create } from 'zustand';
import { uid } from '../lib/id';
import { realtime } from '../services/realtime';
import { EV } from '../services/realtime/events';

/**
 * Shared activities (movie, dance, date, call, music). Invitations are
 * ephemeral; the durable record of "we did this" lives in stats/story.
 * type: 'movie' | 'dance' | 'date' | 'call' | 'music'
 */
export const useActivityStore = create((set, get) => ({
  incoming: null, // { id, type, meta, from }
  outgoing: null, // { id, type, meta, status: 'pending' | 'accepted' | 'declined' }
  sessions: {}, // type → { startedAt, meta }

  invite(type, meta = {}) {
    const inv = { id: uid('inv'), type, meta, status: 'pending' };
    set({ outgoing: inv });
    realtime.emit(EV.ACTIVITY_INVITE, { id: inv.id, type, meta });
    return inv;
  },
  cancelOutgoing: () => set({ outgoing: null }),
  receiveInvite: (inv) => set({ incoming: inv }),
  respond(accept) {
    const inv = get().incoming;
    if (!inv) return null;
    realtime.emit(accept ? EV.ACTIVITY_ACCEPTED : EV.ACTIVITY_DECLINED, { id: inv.id, type: inv.type });
    set({ incoming: null });
    if (accept) get().start(inv.type, inv.meta);
    return inv;
  },
  outgoingResolved(accepted) {
    const out = get().outgoing;
    if (!out) return null;
    set({ outgoing: { ...out, status: accepted ? 'accepted' : 'declined' } });
    if (accepted) get().start(out.type, out.meta);
    setTimeout(() => {
      if (get().outgoing?.id === out.id) set({ outgoing: null });
    }, 2500);
    return out;
  },
  start: (type, meta = {}) => set((s) => ({ sessions: { ...s.sessions, [type]: { startedAt: Date.now(), meta } } })),
  end(type, notify = true) {
    set((s) => {
      const next = { ...s.sessions };
      delete next[type];
      return { sessions: next };
    });
    if (notify) realtime.emit(EV.ACTIVITY_LEAVE, { type });
  },
}));
