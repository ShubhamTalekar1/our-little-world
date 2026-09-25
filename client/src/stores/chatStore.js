import { createStore } from './createStore';
import { DEMO_MODE } from '../config/env';
import { seedMessages, ME_ID } from '../data/mockData';
import { uid } from '../lib/id';
import { cleanText } from '../lib/sanitize';
import { realtime } from '../services/realtime';
import { EV } from '../services/realtime/events';
import { remote, api } from '../services/api/client';

/**
 * message: { id, from, type: 'text' | 'image' | 'voice' | 'gif' | 'sticker', text?, url?, duration?, at, readAt?, reactions: {userId: emoji} }
 */
export const useChatStore = createStore(
  'chat',
  (set, get) => ({
    messages: DEMO_MODE ? seedMessages() : [],
    partnerTyping: false,
    hydrate: (messages) => set({ messages }),

    send(input) {
      const base = typeof input === 'string' ? { type: 'text', text: input } : input;
      if (base.type === 'text') {
        base.text = cleanText(base.text, 2000);
        if (!base.text) return null;
      }
      const msg = { id: uid('msg'), from: get().myId ?? ME_ID, at: new Date().toISOString(), reactions: {}, ...base };
      set((s) => ({ messages: [...s.messages, msg] }));
      realtime.emit(EV.CHAT_MESSAGE, { message: msg });
      remote(() => api.post('/messages', msg));
      return msg;
    },
    receive(msg) {
      if (get().messages.some((m) => m.id === msg.id)) return;
      set((s) => ({ messages: [...s.messages, { reactions: {}, ...msg }], partnerTyping: false }));
    },
    react(id, emoji, userId) {
      set((s) => ({
        messages: s.messages.map((m) => {
          if (m.id !== id) return m;
          const reactions = { ...m.reactions };
          if (reactions[userId] === emoji) delete reactions[userId];
          else reactions[userId] = emoji;
          return { ...m, reactions };
        }),
      }));
    },
    reactMine(id, emoji) {
      const me = get().myId ?? ME_ID;
      get().react(id, emoji, me);
      realtime.emit(EV.CHAT_REACTION, { id, emoji });
      remote(() => api.post(`/messages/${id}/react`, { emoji }));
    },
    markMineRead(at = new Date().toISOString()) {
      const me = get().myId ?? ME_ID;
      set((s) => ({ messages: s.messages.map((m) => (m.from === me && !m.readAt ? { ...m, readAt: at } : m)) }));
    },
    setPartnerTyping: (v) => set({ partnerTyping: v }),
    myId: ME_ID,
    setMyId: (myId) => set({ myId }),
  }),
  { partialize: (s) => ({ messages: s.messages.slice(-300) }) },
);
