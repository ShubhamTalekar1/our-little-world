import { useMemo } from 'react';
import { useStoryStore } from '../stores/storyStore';
import { useChatStore } from '../stores/chatStore';
import { useGiftStore } from '../stores/giftStore';
import { useMemoryStore } from '../stores/memoryStore';
import { useLetterStore } from '../stores/letterStore';
import { usePetStore } from '../stores/petStore';
import { useCheckinStore } from '../stores/checkinStore';
import { usePeopleStore } from '../stores/peopleStore';
import { daysBetween } from '../lib/time';

export function useAchievementSnapshot() {
  const stats = useStoryStore((s) => s.stats);
  const messages = useChatStore((s) => s.messages.length);
  const gifts = useGiftStore((s) => s.received.length + s.sent.length);
  const memories = useMemoryStore((s) => s.memories.length);
  const letters = useLetterStore((s) => s.letters.length);
  const petNamed = usePetStore((s) => !!(s.pet.adopted && s.pet.name));
  const checkins = useCheckinStore((s) => s.checkins.length);
  const since = usePeopleStore((s) => s.couple?.since);
  return useMemo(
    () => ({
      ...stats,
      messages: (stats.messagesBase ?? 0) + messages,
      gifts,
      memories,
      letters,
      petNamed,
      checkins,
      days: since ? daysBetween(since) : 0,
    }),
    [stats, messages, gifts, memories, letters, petNamed, checkins, since],
  );
}
