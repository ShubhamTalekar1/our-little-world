import { api } from './client';
import { usePeopleStore } from '../../stores/peopleStore';
import { useAvatarStore } from '../../stores/avatarStore';
import { useWalletStore } from '../../stores/walletStore';
import { useWardrobeStore } from '../../stores/wardrobeStore';
import { useGiftStore } from '../../stores/giftStore';
import { useRoomStore } from '../../stores/roomStore';
import { useChatStore } from '../../stores/chatStore';
import { useMemoryStore } from '../../stores/memoryStore';
import { useLetterStore } from '../../stores/letterStore';
import { useCalendarStore } from '../../stores/calendarStore';
import { useCheckinStore } from '../../stores/checkinStore';
import { usePetStore } from '../../stores/petStore';
import { useStoryStore } from '../../stores/storyStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { usePresenceStore } from '../../stores/presenceStore';

/** Load the whole (small) world for a couple in one request after login. */
export async function hydrateFromApi() {
  const d = await api.get('/bootstrap');
  usePeopleStore.getState().hydrate(d);
  useAvatarStore.getState().hydrate(d.me.id, d.avatars);
  useChatStore.getState().setMyId(d.me.id);
  useWalletStore.getState().hydrate(d.wallet);
  useWardrobeStore.getState().hydrate(d.wardrobe);
  useGiftStore.getState().hydrate(d.gifts);
  useRoomStore.getState().hydrate(d.room);
  useChatStore.getState().hydrate(d.messages);
  useMemoryStore.getState().hydrate(d.memories);
  useLetterStore.getState().hydrate(d.letters);
  useCalendarStore.getState().hydrate(d.calendar);
  useCheckinStore.getState().hydrate(d.checkins);
  usePetStore.getState().hydrate(d.pet);
  useStoryStore.getState().hydrate(d.story);
  useNotificationStore.getState().hydrate(d.notifications);
  if (d.presence) usePresenceStore.getState().setPartner(d.presence);
  return d;
}
