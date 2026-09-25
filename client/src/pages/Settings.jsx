import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, LogOut, Volume2, RotateCcw } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Toggle from '../components/ui/Toggle';
import Modal from '../components/ui/Modal';
import VirtualWallet, { CoinAmount } from '../components/wallet/VirtualWallet';
import { useSettingsStore } from '../stores/settingsStore';
import { usePeopleStore } from '../stores/peopleStore';
import { useAuthStore } from '../stores/authStore';
import { useWalletStore } from '../stores/walletStore';
import { toast } from '../stores/uiStore';
import { clearPersistedStores } from '../stores/createStore';
import { playSfx } from '../services/audio/sfx';
import { paymentProvider, COIN_PACKS } from '../services/payments';
import { DEMO_MODE } from '../config/env';
import { timeAgo } from '../lib/time';
import { cn } from '../lib/cn';

function Section({ id, title, description, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="card scroll-mt-24 p-5 sm:p-6">
      <h2 id={`${id}-h`} className="text-lg text-cream">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

const SECTIONS = [
  ['profile', 'Profile'],
  ['person', 'Your person'],
  ['account', 'Account'],
  ['notifications', 'Notifications'],
  ['privacy', 'Privacy'],
  ['sound', 'Sound'],
  ['appearance', 'Appearance & motion'],
  ['currency', 'Love Coins'],
  ['couple', 'Couple'],
];

export default function Settings() {
  const s = useSettingsStore();
  const { me, partner, couple, updateMe, updatePartner, updateCouple } = usePeopleStore();
  const logout = useAuthStore((st) => st.logout);
  const { transactions, earn } = useWalletStore();
  const [buying, setBuying] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const navigate = useNavigate();

  const buy = async (pack) => {
    setBuying(pack.id);
    try {
      const res = await paymentProvider.purchase(pack.id);
      if (res.ok) {
        if (res.balance == null) earn(res.coins, `${pack.label} top-up`);
        else useWalletStore.setState({ balance: res.balance });
        playSfx('success');
        toast(`+${res.coins} Love Coins`, { emoji: pack.emoji });
      }
    } catch (e) {
      toast(e.message, { emoji: '🪙', tone: 'error' });
    } finally {
      setBuying(null);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Settings" title="Make it feel right" />
      <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:self-start lg:px-0">
          {SECTIONS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="shrink-0 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-surface-2 hover:text-cream">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex min-w-0 flex-col gap-4">
          <Section id="profile" title="Profile" description="How you show up in your little world.">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="my-name" className="eyebrow mb-1.5 block">Your name</label>
                <input id="my-name" className="field" maxLength={40} value={me?.name ?? ''} onChange={(e) => updateMe({ name: e.target.value })} />
              </div>
              <div>
                <label htmlFor="my-pro" className="eyebrow mb-1.5 block">Your pronouns</label>
                <select id="my-pro" className="field" value={me?.pronouns ?? 'they'} onChange={(e) => updateMe({ pronouns: e.target.value })}>
                  <option value="she">she / her</option>
                  <option value="he">he / him</option>
                  <option value="they">they / them</option>
                </select>
              </div>
              <div>
                <label htmlFor="my-tz" className="eyebrow mb-1.5 block">Your time zone</label>
                <input id="my-tz" className="field" value={me?.timezone ?? ''} onChange={(e) => updateMe({ timezone: e.target.value })} />
              </div>
            </div>
            <Button className="mt-4" onClick={() => navigate('/avatar')}>Edit avatar</Button>
          </Section>

          <Section id="person" title="Your person" description="How the app refers to them — only you see this.">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="p-name" className="eyebrow mb-1.5 block">What you call them</label>
                <input id="p-name" className="field" maxLength={40} value={partner?.name ?? ''} onChange={(e) => updatePartner({ name: e.target.value })} />
              </div>
              <div>
                <label htmlFor="p-pro" className="eyebrow mb-1.5 block">Pronouns</label>
                <select id="p-pro" className="field" value={partner?.pronouns ?? 'they'} onChange={(e) => updatePartner({ pronouns: e.target.value })}>
                  <option value="she">she / her</option>
                  <option value="he">he / him</option>
                  <option value="they">they / them</option>
                </select>
              </div>
              <div>
                <label htmlFor="p-tz" className="eyebrow mb-1.5 block">Their time zone</label>
                <input id="p-tz" className="field" value={partner?.timezone ?? ''} onChange={(e) => updatePartner({ timezone: e.target.value })} />
              </div>
            </div>
          </Section>

          <Section id="account" title="Account">
            <p className="text-sm text-cream-dim">{me?.email}</p>
            <p className="mt-1 text-xs text-muted">{DEMO_MODE ? 'In demo mode nothing leaves this browser. Connect the API to use real accounts.' : 'Signed in with email and password. Sessions expire after 30 days.'}</p>
            <Button variant="danger" icon={LogOut} className="mt-4" onClick={() => { logout(); navigate('/login'); }}>
              Log out
            </Button>
          </Section>

          <Section id="notifications" title="Notifications" description="Gentle, never spammy.">
            <div className="divide-y divide-line">
              {[
                ['gifts', 'Gifts', 'When something arrives for you'],
                ['messages', 'Messages', 'New messages while you’re elsewhere'],
                ['invitations', 'Invitations', 'Movie, dance and date invitations'],
                ['presence', 'Arrivals', 'When they come online'],
                ['reminders', 'Reminders', 'Before plans on your calendar'],
                ['letters', 'Letters', 'When a letter unlocks'],
              ].map(([k, label, d]) => (
                <Toggle key={k} label={label} description={d} checked={s.notifications[k]} onChange={(v) => s.setNotification(k, v)} />
              ))}
            </div>
          </Section>

          <Section id="privacy" title="Privacy" description="Your world is private to the two of you — there are no public profiles or feeds.">
            <div className="divide-y divide-line">
              <Toggle label="Share what I’m doing" description="e.g. “watching a movie”, “customizing an outfit”" checked={s.privacy.showActivity} onChange={(v) => s.setPrivacy('showActivity', v)} />
              <Toggle label="Read receipts" checked={s.privacy.readReceipts} onChange={(v) => s.setPrivacy('readReceipts', v)} />
              <Toggle label="Typing indicator" checked={s.privacy.typingIndicator} onChange={(v) => s.setPrivacy('typingIndicator', v)} />
            </div>
          </Section>

          <Section id="sound" title="Sound" description="Soft chimes for gifts, messages and hearts. Nothing ever autoplays.">
            <Toggle label="Sound effects & music" checked={s.soundEnabled} onChange={(v) => s.set({ soundEnabled: v })} />
            <div className="mt-2 flex items-center gap-3">
              <label htmlFor="vol" className="text-sm text-muted">Volume</label>
              <input id="vol" type="range" min="0" max="1" step="0.05" value={s.volume} onChange={(e) => s.set({ volume: Number(e.target.value) })} className="flex-1 accent-[var(--color-peach)]" disabled={!s.soundEnabled} />
              <Button size="sm" icon={Volume2} onClick={() => playSfx('gift')} disabled={!s.soundEnabled}>
                Test
              </Button>
            </div>
          </Section>

          <Section id="appearance" title="Appearance & motion">
            <p className="eyebrow mb-2">Reduced motion</p>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Reduced motion">
              {[['system', 'Follow my device'], ['on', 'Reduce motion'], ['off', 'Full animation']].map(([v, l]) => (
                <button key={v} role="radio" aria-checked={s.reducedMotion === v} onClick={() => s.set({ reducedMotion: v })} className={cn('rounded-full border px-3.5 py-1.5 text-[13px]', s.reducedMotion === v ? 'border-peach/60 bg-peach/15 text-cream' : 'border-line text-muted hover:text-cream')}>
                  {l}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">The theme is always evening — warm and dim, easy on the eyes.</p>
          </Section>

          <Section id="currency" title="Love Coins" description="Virtual only — no real money is ever charged. Earn them by checking in, going on dates and the daily hello.">
            <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
              <VirtualWallet />
              <div className="grid grid-cols-3 gap-2">
                {COIN_PACKS.map((p) => (
                  <button key={p.id} onClick={() => buy(p)} disabled={!!buying} className="card flex flex-col items-center gap-1 p-3 text-center transition hover:border-line-strong disabled:opacity-60">
                    <span className="text-2xl" aria-hidden>{p.emoji}</span>
                    <span className="text-xs text-cream">{p.label}</span>
                    <CoinAmount amount={p.coins} className="text-xs text-lamp" />
                    <span className="text-[10px] text-faint">{buying === p.id ? 'Adding…' : 'Free · demo'}</span>
                  </button>
                ))}
              </div>
            </div>
            <p className="eyebrow mb-2 mt-5">Recent</p>
            <ul className="divide-y divide-line text-sm">
              {transactions.slice(0, 8).map((t) => (
                <li key={t.id} className="flex justify-between py-2">
                  <span className="text-cream-dim">{t.reason}</span>
                  <span className="flex gap-3">
                    <span className="text-xs text-faint">{timeAgo(t.at)}</span>
                    <span className={cn('tabular-nums', t.amount > 0 ? 'text-sage' : 'text-muted')}>
                      {t.amount > 0 ? '+' : ''}
                      {t.amount}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="couple" title="Couple" description="Just the two of you, always.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="since" className="eyebrow mb-1.5 block">Together since</label>
                <input id="since" type="date" className="field" value={couple?.since?.slice(0, 10) ?? ''} onChange={(e) => e.target.value && updateCouple({ since: new Date(e.target.value).toISOString(), anniversary: new Date(e.target.value).toISOString() })} />
              </div>
              <div>
                <p className="eyebrow mb-1.5">Private invite code</p>
                <div className="flex gap-2">
                  <code className="field font-mono tracking-[0.2em]">{couple?.inviteCode}</code>
                  <Button
                    icon={Copy}
                    aria-label="Copy invite code"
                    onClick={() => {
                      navigator.clipboard?.writeText(couple?.inviteCode ?? '').catch(() => {});
                      toast('Invite code copied', { emoji: '📋' });
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted">Already used — your world is full. ❤️</p>
              </div>
            </div>
            {DEMO_MODE && (
              <div className="mt-6 border-t border-line pt-4">
                <Toggle label="Simulated partner activity" description="Let your (demo) person send gifts, messages and waves on their own." checked={s.simulatePartner} onChange={(v) => s.set({ simulatePartner: v })} />
                <Button variant="danger" size="sm" icon={RotateCcw} className="mt-3" onClick={() => setConfirmReset(true)}>
                  Reset demo world
                </Button>
              </div>
            )}
          </Section>
        </div>
      </div>
      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Start the demo over?">
        <p className="text-sm text-muted">Everything saved in this browser (messages, memories, outfits…) will go back to the starting sample.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmReset(false)}>Keep it</Button>
          <Button
            variant="danger"
            onClick={() => {
              clearPersistedStores();
              window.location.assign('/welcome');
            }}
          >
            Reset
          </Button>
        </div>
      </Modal>
    </div>
  );
}
