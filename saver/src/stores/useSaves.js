import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { enrichUrl } from '../lib/fetchPage.js';
import { findUrl, videoEmbedUrl, videoThumbnail } from '../lib/links.js';
import { classify } from '../lib/classify.js';

// IndexedDB instead of localStorage: no 5 MB ceiling, and it survives
// "clear cache" on most phones. Falls back to memory if IDB is unavailable.
const memory = new Map();
const idbStorage = {
  getItem: async (k) => {
    try {
      return (await idbGet(k)) ?? null;
    } catch {
      return memory.get(k) ?? null;
    }
  },
  setItem: async (k, v) => {
    try {
      await idbSet(k, v);
    } catch {
      memory.set(k, v);
    }
  },
  removeItem: async (k) => {
    try {
      await idbDel(k);
    } catch {
      memory.delete(k);
    }
  },
};

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const now = () => new Date().toISOString();

function newItem(fields) {
  return {
    id: uid(),
    url: null,
    kind: 'other',
    title: '',
    description: '',
    image: '',
    siteName: '',
    author: '',
    notes: '',
    tags: [],
    collectionIds: [],
    status: 'todo',
    doneAt: null,
    rating: 0,
    doneNote: '',
    recipe: null,
    place: null,
    embedUrl: null,
    fetchState: 'idle',
    createdAt: now(),
    updatedAt: now(),
    ...fields,
  };
}

export const useSaves = create(
  persist(
    (set, get) => ({
      items: [],
      collections: [],
      settings: { proxy: '', usePublicProxies: true },

      /** Save from pasted/shared text. Returns the new item's id. */
      add(input, extra = {}) {
        const text = String(input || '').trim();
        const url = findUrl(text);
        const leftover = url ? text.replace(url, '').trim() : text;
        const item = newItem({
          url,
          title: url ? leftover.split('\n')[0].slice(0, 200) : leftover.split('\n')[0].slice(0, 200) || 'Untitled note',
          notes: url ? '' : leftover.split('\n').slice(1).join('\n').trim(),
          kind: classify(url, { title: leftover }),
          image: url ? videoThumbnail(url) || '' : '',
          embedUrl: url ? videoEmbedUrl(url) : null,
          fetchState: url ? 'pending' : 'idle',
          ...extra,
          // Chosen by you when saving, so a refresh shouldn't re-sort it.
          edited: extra.kind ? { kind: true } : {},
        });
        set((s) => ({ items: [item, ...s.items] }));
        if (url) get().refresh(item.id);
        return item.id;
      },

      /** (Re)fetch the link's preview and details. Keeps anything you edited by hand. */
      async refresh(id) {
        const item = get().items.find((i) => i.id === id);
        if (!item?.url) return;
        get().update(id, { fetchState: 'pending' }, { quiet: true });
        const info = await enrichUrl(item.url, get().settings);
        const cur = get().items.find((i) => i.id === id);
        if (!cur) return;
        const edited = cur.edited || {};
        const patch = { fetchState: info.ok ? 'ok' : 'failed', fetchError: info.error };
        for (const k of ['title', 'description', 'image', 'siteName', 'author', 'embedUrl']) {
          if (!edited[k] && info[k]) patch[k] = info[k];
        }
        if (!edited.kind) patch.kind = info.kind;
        if (!edited.recipe && info.recipe) patch.recipe = { ...info.recipe, checked: cur.recipe?.checked || [] };
        if (!edited.place && info.place) patch.place = { ...(cur.place || {}), ...info.place };
        patch.tags = [...new Set([...(cur.tags || []), ...info.tags])];
        get().update(id, patch, { quiet: true });
      },

      /** `quiet` updates come from the fetcher; others are the user's edits and are protected from refreshes. */
      update(id, patch, { quiet = false } = {}) {
        set((s) => ({
          items: s.items.map((i) => {
            if (i.id !== id) return i;
            const edited = quiet ? i.edited : { ...(i.edited || {}), ...Object.fromEntries(Object.keys(patch).map((k) => [k, true])) };
            return { ...i, ...patch, edited, updatedAt: now() };
          }),
        }));
      },

      remove(id) {
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
      },

      setDone(id, done, { rating, doneNote } = {}) {
        const cur = get().items.find((i) => i.id === id);
        get().update(
          id,
          {
            status: done ? 'done' : 'todo',
            doneAt: done ? cur?.doneAt || now() : null,
            ...(rating !== undefined ? { rating } : {}),
            ...(doneNote !== undefined ? { doneNote } : {}),
          },
          { quiet: true }
        );
      },

      addCollection(name, emoji = '📁') {
        const c = { id: uid(), name: name.trim(), emoji, createdAt: now() };
        set((s) => ({ collections: [...s.collections, c] }));
        return c.id;
      },
      renameCollection(id, patch) {
        set((s) => ({ collections: s.collections.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
      },
      removeCollection(id) {
        set((s) => ({
          collections: s.collections.filter((c) => c.id !== id),
          items: s.items.map((i) => ({ ...i, collectionIds: i.collectionIds.filter((x) => x !== id) })),
        }));
      },
      toggleInCollection(itemId, colId) {
        const item = get().items.find((i) => i.id === itemId);
        if (!item) return;
        const ids = item.collectionIds.includes(colId)
          ? item.collectionIds.filter((x) => x !== colId)
          : [...item.collectionIds, colId];
        get().update(itemId, { collectionIds: ids }, { quiet: true });
      },

      setSettings(patch) {
        set((s) => ({ settings: { ...s.settings, ...patch } }));
      },

      exportData() {
        const { items, collections, settings } = get();
        return { app: 'saver', version: 1, exportedAt: now(), items, collections, settings };
      },
      /** Merge a backup in; items with the same id are replaced by the backup's copy. */
      importData(data) {
        if (!data || data.app !== 'saver' || !Array.isArray(data.items)) throw new Error("That file isn't a Saver backup.");
        set((s) => {
          const byId = new Map(s.items.map((i) => [i.id, i]));
          for (const i of data.items) byId.set(i.id, newItem(i));
          const cols = new Map(s.collections.map((c) => [c.id, c]));
          for (const c of data.collections || []) cols.set(c.id, c);
          return {
            items: [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
            collections: [...cols.values()],
          };
        });
        return data.items.length;
      },
      clearAll() {
        set({ items: [], collections: [] });
      },
    }),
    {
      name: 'saver',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => ({ items: s.items, collections: s.collections, settings: s.settings }),
      onRehydrateStorage: () => (state) => {
        // A fetch interrupted by closing the app would otherwise spin forever.
        state?.items.filter((i) => i.fetchState === 'pending').forEach((i) => state.refresh(i.id));
      },
    }
  )
);

export function searchItems(items, q) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return items;
  return items.filter((i) => {
    const hay = [
      i.title, i.description, i.notes, i.siteName, i.author, i.url, i.doneNote,
      i.place?.name, i.place?.address, ...(i.tags || []), ...(i.recipe?.ingredients || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}
