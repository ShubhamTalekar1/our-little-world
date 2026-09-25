import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageHeader from '../components/ui/PageHeader';
import Tabs from '../components/ui/Tabs';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import GiftCard from '../components/gifts/GiftCard';
import GiftArt from '../components/gifts/GiftArt';
import { GIFTS, GIFTS_BY_ID, RARITY, GIFT_MESSAGES } from '../catalog/gifts';
import { useGiftStore } from '../stores/giftStore';
import { usePeopleStore } from '../stores/peopleStore';
import { useUiStore, toast } from '../stores/uiStore';
import { useStoryStore } from '../stores/storyStore';
import { usePartnerWords } from '../lib/words';
import { timeAgo, formatDate } from '../lib/time';
import { playSfx } from '../services/audio/sfx';

function SendGiftModal({ gift, onClose }) {
  const w = usePartnerWords();
  const partner = usePeopleStore((s) => s.partner);
  const send = useGiftStore((s) => s.send);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  if (!gift) return null;

  const onSend = () => {
    setSending(true);
    setTimeout(() => {
      const res = send(gift.id, message, partner.id);
      setSending(false);
      if (!res.ok) {
        toast('That didn’t send — try again?', { emoji: '☁️', tone: 'error' });
        return;
      }
      onClose();
      playSfx('gift');
      useUiStore.getState().setSendingGift({ giftId: gift.id, key: res.gift.id });
      setTimeout(() => useUiStore.getState().setSendingGift(null), 2800);
      toast(`${gift.name.replace(/^(A |The )/, '')} sent ❤️`, { emoji: gift.emoji });
      useStoryStore.getState().recordFirst('first-gift', '🎁', 'First gift', `${gift.name}, from you.`);
    }, 350);
  };

  return (
    <Modal open={!!gift} onClose={onClose} labelledBy="send-gift-title" className="text-center">
      <div className="flex flex-col items-center">
        <GiftArt gift={gift} size={140} />
        <p className="mt-2 text-xs" style={{ color: RARITY[gift.rarity].color }}>
          {RARITY[gift.rarity].label}
        </p>
        <h2 id="send-gift-title" className="mt-1 text-2xl text-cream">
          {gift.name}
        </h2>
        <p className="mt-1 max-w-xs text-sm text-muted">{gift.description}</p>

        <label htmlFor="gift-msg" className="eyebrow mb-2 mt-6 self-start">
          A little note
        </label>
        <textarea id="gift-msg" rows={2} maxLength={200} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Just because." className="field resize-none" />
        <div className="mt-2 flex flex-wrap gap-1.5 self-start">
          {GIFT_MESSAGES.map((m) => (
            <button key={m} onClick={() => setMessage(m)} className="chip hover:border-line-strong hover:text-cream">
              {m}
            </button>
          ))}
        </div>

        <div className="mt-6 flex w-full justify-center">
          <Button variant="primary" size="lg" onClick={onSend} loading={sending} data-autofocus>
            Send to {w.them} ❤️
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Shop({ onPick }) {
  const [rarity, setRarity] = useState('all');
  const list = GIFTS.filter((g) => rarity === 'all' || g.rarity === rarity);
  return (
    <>
      <div className="no-scrollbar mb-5 flex gap-1.5 overflow-x-auto">
        {['all', ...Object.keys(RARITY)].map((r) => (
          <button
            key={r}
            onClick={() => setRarity(r)}
            aria-pressed={rarity === r}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] capitalize transition ${rarity === r ? 'bg-surface-3 text-cream ring-1 ring-line-strong' : 'text-muted hover:text-cream'}`}
          >
            {r === 'all' ? 'Everything' : RARITY[r].label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {list.map((g, i) => (
          <GiftCard key={g.id} gift={g} index={i} onSelect={onPick} />
        ))}
      </div>
    </>
  );
}

function Collection() {
  const received = useGiftStore((s) => s.received);
  const openGift = useUiStore((s) => s.setOpeningGift);
  const w = usePartnerWords();
  if (!received.length)
    return (
      <EmptyState emoji="🎁" title="Nothing here yet">
        Gifts from {w.them} will be kept here, forever.
      </EmptyState>
    );
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {received.map((g, i) => {
        const gift = GIFTS_BY_ID[g.opened ? g.revealed ?? g.giftId : 'mystery'];
        return (
          <motion.button
            key={g.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 12) * 0.04 }}
            whileHover={{ y: -3 }}
            onClick={() => openGift(g.id)}
            className={`card relative flex flex-col items-center p-4 text-center transition hover:border-line-strong ${!g.opened ? 'ring-1 ring-lamp/40' : ''}`}
          >
            {!g.opened && <span className="absolute right-3 top-3 rounded-full bg-lamp/20 px-2 py-0.5 text-[10px] font-medium text-lamp">Unopened</span>}
            <GiftArt gift={gift} size={80} still={g.opened} />
            <p className="mt-2 text-sm text-cream">{g.opened ? gift.name : 'A surprise'}</p>
            {g.opened && g.message && <p className="hand mt-1 line-clamp-2 text-lg leading-tight text-peach">“{g.message}”</p>}
            <p className="mt-auto pt-2 text-[11px] text-muted">
              from {w.them} · {timeAgo(g.at)}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}

function Sent() {
  const sent = useGiftStore((s) => s.sent);
  const w = usePartnerWords();
  if (!sent.length)
    return (
      <EmptyState emoji="💌" title="You haven’t sent anything yet">
        Go on. {w.Subject}’ll love it.
      </EmptyState>
    );
  return (
    <ul className="flex flex-col gap-2">
      {sent.map((g) => {
        const gift = GIFTS_BY_ID[g.giftId];
        return (
          <li key={g.id} className="card flex items-center gap-4 p-3 pr-5">
            <GiftArt gift={gift} size={52} still />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-cream">
                {gift.name} <span className="text-muted">to {w.them}</span>
              </p>
              {g.message && <p className="truncate text-xs text-muted">“{g.message}”</p>}
            </div>
            <span className="shrink-0 text-xs text-faint">{formatDate(g.at, { month: 'short', day: 'numeric' })}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function Gifts() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'shop';
  const [picked, setPicked] = useState(null);
  const received = useGiftStore((s) => s.received);
  const sent = useGiftStore((s) => s.sent);
  const unopened = useMemo(() => received.filter((g) => !g.opened).length, [received]);
  const w = usePartnerWords();
  return (
    <div>
      <PageHeader eyebrow="Gifts" title={`Send ${w.them} something`} subtitle="Little things, for no reason at all." />
      <Tabs
        tabs={[
          { id: 'shop', label: 'Gift shop', emoji: '🛍️' },
          { id: 'collection', label: 'From ' + w.them, emoji: '🎁', count: unopened ? `${unopened} new` : received.length },
          { id: 'sent', label: 'Sent', emoji: '💌', count: sent.length },
        ]}
        value={tab}
        onChange={(t) => setParams({ tab: t })}
        layoutId="gift-tabs"
        className="mb-6"
      />
      {tab === 'shop' && <Shop onPick={setPicked} />}
      {tab === 'collection' && <Collection />}
      {tab === 'sent' && <Sent />}
      <SendGiftModal gift={picked} onClose={() => setPicked(null)} />
    </div>
  );
}
