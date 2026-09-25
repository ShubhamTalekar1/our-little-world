import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEMO_MODE } from '../config/env';

/**
 * In demo mode every store persists to localStorage so the little world
 * survives refreshes. With a real backend, private data is NOT cached in the
 * browser (it's hydrated from the API after login) — only UI preferences are.
 */
// v2 removed the pre-filled sample world; older saved demo data is dropped so
// everyone starts with an empty world of their own.
const STORAGE_VERSION = 2;

export function createStore(name, initializer, { alwaysPersist = false, version = STORAGE_VERSION, partialize, migrate } = {}) {
  if (!DEMO_MODE && !alwaysPersist) return create(initializer);
  return create(
    persist(initializer, {
      name: `olw:${name}`,
      version,
      storage: createJSONStorage(() => localStorage),
      ...(partialize ? { partialize } : {}),
      migrate: migrate ?? ((state, from) => (from < STORAGE_VERSION ? {} : state)),
    }),
  );
}

/** Wipe every demo store (used by "Reset demo world" in settings). */
export function clearPersistedStores() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith('olw:'))
    .forEach((k) => localStorage.removeItem(k));
}
