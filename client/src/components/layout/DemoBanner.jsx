import { useState } from 'react';
import { DEMO_MODE } from '../../config/env';

export default function DemoBanner() {
  const [hidden, setHidden] = useState(() => {
    try {
      return sessionStorage.getItem('olw:demo-banner') === 'x';
    } catch {
      return false;
    }
  });
  if (!DEMO_MODE || hidden) return null;
  return (
    <div className="mx-auto mt-3 flex w-[calc(100%-2rem)] max-w-6xl items-center justify-between gap-3 rounded-2xl border border-lavender/20 bg-lavender/[0.07] px-4 py-2 text-[12.5px] text-cream-dim sm:w-[calc(100%-3rem)]">
      <span>
        <span className="mr-1.5" aria-hidden>🌙</span>
        Demo world — your person is simulated and everything is saved in this browser.
      </span>
      <button
        className="shrink-0 text-muted hover:text-cream"
        onClick={() => {
          try {
            sessionStorage.setItem('olw:demo-banner', 'x');
          } catch {
            /* ignore */
          }
          setHidden(true);
        }}
        aria-label="Hide demo notice"
      >
        ×
      </button>
    </div>
  );
}
