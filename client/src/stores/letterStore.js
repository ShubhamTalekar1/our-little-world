import { createStore } from './createStore';
import { DEMO_MODE } from '../config/env';
import { seedLetters } from '../data/mockData';
import { uid } from '../lib/id';
import { cleanText } from '../lib/sanitize';
import { realtime } from '../services/realtime';
import { EV } from '../services/realtime/events';
import { remote, api } from '../services/api/client';

export const isUnlocked = (letter, at = Date.now()) => new Date(letter.unlockAt).getTime() <= at;

export const useLetterStore = createStore('letters', (set) => ({
  letters: DEMO_MODE ? seedLetters() : [],
  hydrate: (letters) => set({ letters }),
  write({ title, body, unlockAt, seal, paper }, from) {
    const letter = {
      id: uid('l'),
      from,
      title: cleanText(title, 80) || 'A letter for you',
      body: cleanText(body, 8000),
      unlockAt: unlockAt ?? new Date().toISOString(),
      at: new Date().toISOString(),
      openedAt: null,
      seal: seal ?? 'heart',
      paper: paper ?? 'cream',
    };
    set((s) => ({ letters: [letter, ...s.letters] }));
    realtime.emit(EV.LETTER_SENT, { letter });
    remote(() => api.post('/letters', letter));
    return letter;
  },
  receive: (letter) => set((s) => (s.letters.some((l) => l.id === letter.id) ? s : { letters: [letter, ...s.letters] })),
  markOpened(id) {
    set((s) => ({ letters: s.letters.map((l) => (l.id === id && !l.openedAt ? { ...l, openedAt: new Date().toISOString() } : l)) }));
    // The server only reveals a sealed letter's words once it has unlocked.
    remote(() => api.post(`/letters/${id}/open`)).then((res) => {
      if (res?.letter) set((s) => ({ letters: s.letters.map((l) => (l.id === id ? { ...l, ...res.letter } : l)) }));
    });
  },
}));
