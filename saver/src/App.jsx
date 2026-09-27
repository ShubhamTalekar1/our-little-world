import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { CheckCircle2, Home as HomeIcon, Map as MapIcon, Plus, Settings as SettingsIcon } from 'lucide-react';
import { useSaves } from './stores/useSaves.js';
import AddSheet from './components/AddSheet.jsx';
import Home from './pages/Home.jsx';
import Collection from './pages/Collection.jsx';
import Item from './pages/Item.jsx';
import MapPage from './pages/MapPage.jsx';
import Done from './pages/Done.jsx';
import Settings from './pages/Settings.jsx';
import { closeTopSheet, interceptExternalLinks, listenForBack, listenForShares } from './lib/native.js';

interceptExternalLinks();

/**
 * Android's share sheet opens the app at ./?title=…&text=…&url=…
 * Read it once at startup (not in an effect, which StrictMode runs twice)
 * and tidy the address bar.
 */
const pendingShare = { input: null };
{
  const p = new URLSearchParams(window.location.search);
  // Many apps put the link in `text` and repeat it in `url`; keep one copy.
  const url = p.get('url');
  const text = [p.get('title'), p.get('text')].filter(Boolean).join('\n');
  const input = url && !text.includes(url) ? [text, url].filter(Boolean).join('\n') : text;
  if (input) {
    pendingShare.input = input;
    history.replaceState(null, '', window.location.pathname + window.location.hash);
  }
}

function useShareTarget(hydrated) {
  const add = useSaves((s) => s.add);
  const navigate = useNavigate();
  const [queue, setQueue] = useState(() => (pendingShare.input ? [pendingShare.input] : []));
  // In the Android app, shares come from the native side instead of the URL.
  useEffect(() => listenForShares((input) => setQueue((q) => [...q, input])), []);
  useEffect(() => {
    // Wait for saved data to load so the new item isn't overwritten by rehydration.
    if (!hydrated || !queue.length) return;
    pendingShare.input = null;
    let last;
    for (const input of queue) last = add(input);
    setQueue([]);
    navigate(`/item/${last}`);
  }, [hydrated, queue, add, navigate]);
}

const tabs = [
  { to: '/', label: 'Saves', icon: HomeIcon, end: true },
  { to: '/map', label: 'Map', icon: MapIcon },
  { to: '/done', label: 'Done', icon: CheckCircle2 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function App() {
  const [adding, setAdding] = useState(false);
  const [hydrated, setHydrated] = useState(useSaves.persist.hasHydrated());
  useEffect(() => {
    if (useSaves.persist.hasHydrated()) setHydrated(true);
    return useSaves.persist.onFinishHydration(() => setHydrated(true));
  }, []);
  useShareTarget(hydrated);
  useEffect(() => listenForBack(closeTopSheet), []);

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <main className="flex-1 pb-28">
        {hydrated ? (
          <Routes>
            <Route path="/" element={<Home onAdd={() => setAdding(true)} />} />
            <Route path="/kind/:kind" element={<Collection />} />
            <Route path="/collection/:id" element={<Collection />} />
            <Route path="/item/:id" element={<Item />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/done" element={<Done />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Home onAdd={() => setAdding(true)} />} />
          </Routes>
        ) : null}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-[1000] border-t border-line bg-paper/90 backdrop-blur-lg safe-bottom">
        <div className="relative mx-auto grid max-w-3xl grid-cols-5 items-center px-2 pt-1.5">
          {tabs.slice(0, 2).map((t) => (
            <Tab key={t.to} {...t} />
          ))}
          <div className="flex justify-center">
            <button
              onClick={() => setAdding(true)}
              aria-label="Save something"
              className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-ink shadow-lg shadow-black/15 transition active:scale-95"
            >
              <Plus size={26} strokeWidth={2.4} />
            </button>
          </div>
          {tabs.slice(2).map((t) => (
            <Tab key={t.to} {...t} />
          ))}
        </div>
      </nav>

      {adding && <AddSheet onClose={() => setAdding(false)} />}
    </div>
  );
}

function Tab({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition ${
          isActive ? 'text-ink' : 'text-ink-3'
        }`
      }
    >
      <Icon size={21} strokeWidth={2} />
      {label}
    </NavLink>
  );
}
