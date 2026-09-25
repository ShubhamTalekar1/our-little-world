import { useState } from 'react';
import { Plus } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Timeline from '../components/story/Timeline';
import { useStoryStore } from '../stores/storyStore';
import { useCalendarStore } from '../stores/calendarStore';
import { usePeopleStore } from '../stores/peopleStore';
import { toast } from '../stores/uiStore';
import { daysBetween, countdownParts } from '../lib/time';

const EMOJIS = ['✨', '❤️', '📞', '💬', '🌅', '🎁', '🎬', '💃', '📸', '✈️', '🏡', '💍'];

export default function Story() {
  const milestones = useStoryStore((s) => s.milestones);
  const addMilestone = useStoryStore((s) => s.addMilestone);
  const removeMilestone = useStoryStore((s) => s.removeMilestone);
  const countdowns = useCalendarStore((s) => s.countdowns);
  const couple = usePeopleStore((s) => s.couple);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ emoji: '✨', title: '', note: '', date: new Date().toISOString().slice(0, 10) });

  const meetup = countdowns.find((c) => /see each other|meet/i.test(c.title) && new Date(c.target) > Date.now());
  const items = [
    ...[...milestones].sort((a, b) => new Date(a.date) - new Date(b.date)).map((m) => ({ ...m, removable: m.kind === 'manual' })),
    ...(meetup ? [{ id: 'next-meetup', emoji: '✈️', title: 'Next meetup', note: `${countdownParts(meetup.target).days} days to go.`, future: true }] : []),
  ];

  const save = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    addMilestone({ ...form, date: new Date(form.date).toISOString() });
    toast('Added to our story', { emoji: form.emoji });
    setForm({ ...form, title: '', note: '' });
    setOpen(false);
  };

  return (
    <div>
      <PageHeader eyebrow="Our story" title="How we got here" subtitle={couple ? `${daysBetween(couple.since)} days, and counting.` : undefined}>
        <Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>
          Add a moment
        </Button>
      </PageHeader>
      <Timeline items={items} onRemove={removeMilestone} />
      <Modal open={open} onClose={() => setOpen(false)} title="Add a moment">
        <form onSubmit={save} className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Symbol">
            {EMOJIS.map((em) => (
              <button type="button" key={em} role="radio" aria-checked={form.emoji === em} onClick={() => setForm({ ...form, emoji: em })} className={`grid h-9 w-9 place-items-center rounded-xl text-lg ${form.emoji === em ? 'bg-peach/20 ring-1 ring-peach/50' : 'bg-surface-3/60'}`}>
                {em}
              </button>
            ))}
          </div>
          <div>
            <label htmlFor="ms-title" className="eyebrow mb-1.5 block">What happened</label>
            <input id="ms-title" data-autofocus className="field" maxLength={80} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="First time we said it" />
          </div>
          <div>
            <label htmlFor="ms-note" className="eyebrow mb-1.5 block">A line about it</label>
            <input id="ms-note" className="field" maxLength={240} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          <div>
            <label htmlFor="ms-date" className="eyebrow mb-1.5 block">When</label>
            <input id="ms-date" type="date" className="field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={!form.title.trim()}>Add</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
