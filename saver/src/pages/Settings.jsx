import { useRef, useState } from 'react';
import { Download, Loader2, Upload } from 'lucide-react';
import { useSaves } from '../stores/useSaves.js';
import { fetchHtml } from '../lib/fetchPage.js';
import { PageHeader, btnGhost, input } from '../components/ui.jsx';
import { isNative } from '../lib/native.js';

export default function Settings() {
  const settings = useSaves((s) => s.settings);
  const count = useSaves((s) => s.items.length);
  const { setSettings, exportData, importData, clearAll } = useSaves.getState();
  const [proxy, setProxy] = useState(settings.proxy || '');
  const [test, setTest] = useState(null);
  const [msg, setMsg] = useState('');
  const file = useRef(null);

  const saveProxy = () => setSettings({ proxy: proxy.trim() });

  const runTest = async () => {
    saveProxy();
    setTest('busy');
    try {
      await fetchHtml('https://example.com/', { proxy: proxy.trim(), usePublicProxies: !proxy.trim() });
      setTest('ok');
    } catch (e) {
      setTest(`fail:${e.message}`);
    }
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `saver-backup-${new Date().toISOString().slice(0, 10)}.json`,
    });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const upload = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const n = importData(JSON.parse(await f.text()));
      setMsg(`Imported ${n} save${n === 1 ? '' : 's'}.`);
    } catch (err) {
      setMsg(err.message || 'That file could not be read.');
    }
  };

  return (
    <>
      <PageHeader title="Settings" />
      <div className="space-y-4 px-4">
        <Card title="Your data">
          <p className="text-[14px] text-ink-2">
            {count} save{count === 1 ? '' : 's'}, stored only on this device. Nothing is uploaded anywhere. Back up now
            and then, and use the backup to move to a new phone.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={download} className={btnGhost}>
              <Download size={15} /> Export backup
            </button>
            <button onClick={() => file.current?.click()} className={btnGhost}>
              <Upload size={15} /> Import backup
            </button>
            <input ref={file} type="file" accept="application/json,.json" onChange={upload} hidden />
          </div>
          {msg && <p className="mt-2 text-[13px] text-ink-2">{msg}</p>}
        </Card>

        {!isNative && (
          <>
            <Card title="Link previews">
              <p className="text-[14px] text-ink-2">
                To read a page’s title, photo, recipe or address, Saver fetches it through a proxy. Free public proxies work
                but can be slow or blocked. Your own free Cloudflare Worker is fast and private: see{' '}
                <code className="rounded bg-sunk px-1 text-[12px]">saver/worker/README.md</code>.
              </p>
              <label className="mt-3 block text-[13px] font-medium">Your proxy URL</label>
              <input
                value={proxy}
                onChange={(e) => setProxy(e.target.value)}
                onBlur={saveProxy}
                placeholder="https://saver-proxy.you.workers.dev/?url={url}"
                className={`${input} mt-1 py-2.5 text-[14px]`}
                inputMode="url"
                autoCapitalize="off"
                autoCorrect="off"
              />
              <label className="mt-3 flex items-center gap-2 text-[14px]">
                <input
                  type="checkbox"
                  checked={settings.usePublicProxies !== false}
                  onChange={(e) => setSettings({ usePublicProxies: e.target.checked })}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Fall back to public proxies
              </label>
              <div className="mt-3 flex items-center gap-3">
                <button onClick={runTest} className={btnGhost} disabled={test === 'busy'}>
                  {test === 'busy' && <Loader2 size={15} className="animate-spin" />} Test
                </button>
                {test === 'ok' && <span className="text-[13px] text-good">Working ✓</span>}
                {test?.startsWith('fail') && <span className="text-[13px] text-accent">Not reachable ({test.slice(5)})</span>}
              </div>
            </Card>

            <Card title="Add to your home screen">
              <ul className="list-disc space-y-1 pl-5 text-[14px] text-ink-2">
                <li>
                  <b className="text-ink">Android (Chrome):</b> menu ⋮ → <i>Install app</i>. After that, Saver appears in the
                  share sheet of every app: share a link to it and it’s saved.
                </li>
                <li>
                  <b className="text-ink">iPhone (Safari):</b> Share → <i>Add to Home Screen</i>. iOS doesn’t let web apps
                  receive shares, so copy a link and use <i>Paste</i> in the + sheet.
                </li>
              </ul>
            </Card>
          </>
        )}

        <Card title="Start over">
          <button
            onClick={() => {
              if (confirm('Delete every save and collection on this device? Export a backup first if unsure.')) clearAll();
            }}
            className="text-[14px] font-medium text-accent"
          >
            Delete all saves
          </button>
        </Card>
      </div>
    </>
  );
}

function Card({ title, children }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <h2 className="mb-2 font-display text-xl">{title}</h2>
      {children}
    </section>
  );
}
