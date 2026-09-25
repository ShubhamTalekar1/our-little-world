import { realtime } from './index';
import { DEMO_MODE } from '../../config/env';
import { EV } from './events';
import { GIFTS_BY_ID } from '../../catalog/gifts';
import { INTERACTIONS_BY_ID } from '../../catalog/interactions';
import { MOODS_BY_ID } from '../../catalog/moods';
import { ENV_BY_ID } from '../../catalog/environments';
import { partnerWords } from '../../lib/words';
import { playSfx } from '../audio/sfx';
import { useGiftStore } from '../../stores/giftStore';
import { useChatStore } from '../../stores/chatStore';
import { usePresenceStore } from '../../stores/presenceStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useActivityStore } from '../../stores/activityStore';
import { useUiStore } from '../../stores/uiStore';
import { useAvatarStore } from '../../stores/avatarStore';
import { useRoomStore } from '../../stores/roomStore';
import { useLetterStore } from '../../stores/letterStore';
import { useMemoryStore } from '../../stores/memoryStore';
import { useCheckinStore } from '../../stores/checkinStore';
import { useCalendarStore } from '../../stores/calendarStore';
import { usePetStore } from '../../stores/petStore';
import { useMusicStore } from '../../stores/musicStore';
import { useStoryStore } from '../../stores/storyStore';
import { useSettingsStore } from '../../stores/settingsStore';

const notify = (prefKey, n, sound = 'notification') => {
  const prefs = useSettingsStore.getState().notifications;
  if (prefKey && prefs[prefKey] === false) return;
  // With a real backend the server stores notifications and sends them to us.
  if (DEMO_MODE) useNotificationStore.getState().push(n);
  if (sound) playSfx(sound);
};

const INVITE_COPY = {
  movie: (w) => ({ title: `${w.Subject} wants to watch a movie with you 🎬`, link: '/together/movie' }),
  dance: (w) => ({ title: `${w.Subject} wants to slow dance with you 💃`, link: '/together/dance' }),
  date: (w) => ({ title: `${w.Subject} planned a date for you 🌃`, link: '/date-night' }),
  call: (w) => ({ title: `${w.Subject} wants you to come sit with ${w.them} ❤️`, link: '/together/call' }),
  music: (w) => ({ title: `${w.Subject} wants to listen together 🎶`, link: '/together/music' }),
};

/** Wire incoming realtime events (from the other person) into the stores. */
export function bindRealtime() {
  const offs = [];
  const on = (e, fn) => offs.push(realtime.on(e, fn));

  on(EV.USER_ONLINE, ({ activity }) => {
    const prev = usePresenceStore.getState().partner;
    usePresenceStore.getState().setPartner({ status: 'online', activity: activity ?? { type: 'room' } });
    if (prev.status === 'offline') {
      const w = partnerWords();
      useUiStore.getState().toast(`${w.Subject} ${w.plural ? 'are' : 'is'} here`, { emoji: '🤍' });
      // Only leave a notification after a real absence, not every reconnect.
      const away = Date.now() - new Date(prev.lastSeen ?? 0).getTime();
      if (away > 30 * 60_000) notify('presence', { type: 'presence', title: `${w.Subject} came online`, body: 'Say hi 👋', link: '/' }, null);
    }
  });
  on(EV.USER_OFFLINE, (p) => {
    if (p?.self) return;
    usePresenceStore.getState().setPartner({ status: 'offline', activity: null, lastSeen: new Date().toISOString() });
  });
  on(EV.PRESENCE_UPDATE, ({ status, activity }) => usePresenceStore.getState().setPartner({ status: status ?? 'online', activity }));

  on(EV.GIFT_RECEIVED, (g) => {
    const gift = useGiftStore.getState().receive(g);
    if (!gift) return;
    const w = partnerWords();
    notify('gifts', { type: 'gift', title: 'Someone sent you something ❤️', body: `${w.Subject} left a little gift for you`, link: '/gifts?tab=collection', giftId: gift.id }, 'gift');
    useUiStore.getState().toast('Someone sent you something ❤️', {
      emoji: '🎁',
      duration: 6000,
      action: { label: 'Open gift', giftId: gift.id },
    });
    useStoryStore.getState().recordFirst('first-gift', '🎁', 'First gift', `${GIFTS_BY_ID[gift.giftId]?.name ?? 'A gift'}.`);
  });
  on(EV.GIFT_OPENED, () => {
    const w = partnerWords();
    useUiStore.getState().toast(`${w.Subject} opened your gift`, { emoji: '🥹' });
  });

  on(EV.CHAT_MESSAGE, ({ message }) => {
    useChatStore.getState().receive(message);
    const onChat = window.location.pathname.startsWith('/chat');
    if (!onChat) {
      const w = partnerWords();
      notify('messages', { type: 'message', title: `${w.Subject}: ${message.text ?? (message.type === 'image' ? '📷 Photo' : '🎙️ Voice note')}`, body: '', link: '/chat' }, 'message');
    } else {
      playSfx('message');
    }
  });
  on(EV.CHAT_TYPING, ({ typing }) => useChatStore.getState().setPartnerTyping(!!typing));
  on(EV.CHAT_READ, ({ at }) => useChatStore.getState().markMineRead(at));
  on(EV.CHAT_REACTION, ({ id, emoji, from }) => useChatStore.getState().react(id, emoji, from));

  on(EV.INTERACTION, ({ type }) => {
    const ix = INTERACTIONS_BY_ID[type];
    if (!ix) return;
    useUiStore.getState().playInteraction(type, 'partner');
    const w = partnerWords();
    useUiStore.getState().toast(`${w.Subject} ${ix.verb}`, { emoji: ix.emoji });
    playSfx('heart');
    if (type === 'hug') useStoryStore.getState().inc('hugs');
  });

  on(EV.ACTIVITY_INVITE, (inv) => {
    const w = partnerWords();
    const copy = INVITE_COPY[inv.type]?.(w) ?? { title: `${w.Subject} invited you`, link: '/together' };
    useActivityStore.getState().receiveInvite(inv);
    notify('invitations', { type: 'invite', title: copy.title, body: 'Accept or decline', link: copy.link }, 'notification');
  });
  on(EV.ACTIVITY_ACCEPTED, () => {
    const out = useActivityStore.getState().outgoingResolved(true);
    if (out) playSfx('success');
  });
  on(EV.ACTIVITY_DECLINED, () => {
    const out = useActivityStore.getState().outgoingResolved(false);
    if (out) {
      const w = partnerWords();
      useUiStore.getState().toast(`${w.Subject} can’t right now — maybe in a bit`, { emoji: '🤍' });
    }
  });
  on(EV.ACTIVITY_LEAVE, ({ type }) => useActivityStore.getState().end(type, false));

  on(EV.AVATAR_UPDATE, ({ avatar, from }) => avatar && useAvatarStore.getState().setAvatar(from, avatar));
  on(EV.ROOM_UPDATE, (payload) => {
    const before = useRoomStore.getState().environment;
    useRoomStore.getState().applyRemote(payload);
    if (payload.environment && payload.environment !== before) {
      const w = partnerWords();
      useUiStore.getState().toast(`${w.Subject} moved you both ${ENV_BY_ID[payload.environment]?.presence ?? 'somewhere new'}`, { emoji: ENV_BY_ID[payload.environment]?.emoji });
    }
  });

  on(EV.LETTER_SENT, ({ letter }) => {
    useLetterStore.getState().receive(letter);
    notify('letters', { type: 'letter', title: 'A letter arrived 💌', body: letter.title, link: '/letters' }, 'notification');
  });
  on(EV.MEMORY_ADDED, ({ memory }) => {
    useMemoryStore.getState().receive(memory);
    notify(null, { type: 'memory', title: 'New memory on the wall 📸', body: memory.caption, link: '/memories' });
  });
  on(EV.MEMORY_REACTION, ({ id, emoji, from }) => id && useMemoryStore.getState().react(id, from, emoji, false));
  on(EV.CHECKIN_NEW, ({ checkin }) => {
    useCheckinStore.getState().receive(checkin);
    const w = partnerWords();
    const mood = MOODS_BY_ID[checkin.mood];
    notify(null, { type: 'checkin', title: `${w.Theyre} feeling ${mood?.emoji} ${mood?.label} today`, body: checkin.note, link: '/dates' });
  });
  on(EV.EVENT_CREATED, ({ event }) => {
    useCalendarStore.getState().receiveEvent(event);
    notify('reminders', { type: 'event', title: `New plan: ${event.title} ${event.emoji ?? ''}`, body: new Date(event.at).toLocaleString(), link: '/dates' });
  });
  // Server-created notifications (real backend only).
  on('notification:new', (n) => {
    const store = useNotificationStore.getState();
    if (!store.items.some((x) => x.id === n.id)) useNotificationStore.setState({ items: [n, ...store.items].slice(0, 60) });
  });
  on(EV.PET_UPDATE, ({ pet }) => usePetStore.getState().applyRemote(pet));

  on(EV.MUSIC_PLAY, ({ songId, position }) => useMusicStore.getState().together && useMusicStore.getState().applyRemote({ songId, position, playing: true }));
  on(EV.MUSIC_TRACK, ({ songId, position }) => useMusicStore.getState().together && useMusicStore.getState().applyRemote({ songId, position, playing: true }));
  on(EV.MUSIC_PAUSE, ({ songId, position }) => useMusicStore.getState().together && useMusicStore.getState().applyRemote({ songId, position, playing: false }));

  return () => offs.forEach((off) => off());
}
