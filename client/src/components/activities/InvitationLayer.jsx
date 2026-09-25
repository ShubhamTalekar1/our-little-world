import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Avatar from '../avatar/Avatar';
import { useActivityStore } from '../../stores/activityStore';
import { useAvatarStore } from '../../stores/avatarStore';
import { usePeopleStore } from '../../stores/peopleStore';
import { usePartnerWords } from '../../lib/words';
import { playSfx } from '../../services/audio/sfx';
import { FRIENDS } from '../../config/features';

export const ACTIVITY_META = {
  movie: { emoji: '🎬', path: '/together/movie', ask: (w) => `${w.Subject} ${w.v('wants', 'want')} to watch a movie with you`, waiting: (w) => `Waiting for ${w.them} to grab popcorn…` },
  dance: { emoji: '💃', path: '/together/dance', ask: (w, me) => `${w.Subject} ${w.v('wants', 'want')} to slow dance with you`, waiting: (w) => `Asking ${w.them} to dance…` },
  date: { emoji: '🌃', path: '/date-night', ask: (w) => `${w.Subject} planned a date for you`, waiting: (w) => `Sending ${w.them} your date plan…` },
  call: { emoji: FRIENDS ? '📹' : '❤️', path: '/together/call', ask: (w) => `${w.Subject} ${w.v('wants', 'want')} you to come sit with ${w.them}`, waiting: (w) => `Waiting for ${w.them} to join…` },
  music: { emoji: '🎶', path: '/together/music', ask: (w) => `${w.Subject} ${w.v('wants', 'want')} to listen to music together`, waiting: (w) => `Waiting for ${w.them}…` },
};

export default function InvitationLayer() {
  const incoming = useActivityStore((s) => s.incoming);
  const outgoing = useActivityStore((s) => s.outgoing);
  const respond = useActivityStore((s) => s.respond);
  const partner = usePeopleStore((s) => s.partner);
  const avatar = useAvatarStore((s) => s.avatars[partner?.id]);
  const w = usePartnerWords();
  const navigate = useNavigate();
  const meta = incoming ? ACTIVITY_META[incoming.type] : null;

  const answer = (accept) => {
    const inv = respond(accept);
    if (accept && inv) {
      playSfx('success');
      navigate(inv.meta?.path ?? ACTIVITY_META[inv.type]?.path ?? '/together');
    }
  };

  return (
    <>
      <Modal open={!!incoming} onClose={() => answer(false)} hideClose className="text-center">
        {meta && (
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <Avatar config={avatar} size={150} pose={incoming.type === 'dance' ? 'dance' : 'wave'} flip />
              <span className="absolute -right-2 top-2 text-3xl" aria-hidden>
                {meta.emoji}
              </span>
            </div>
            <h2 className="text-2xl text-cream">{meta.ask(w)}</h2>
            {incoming.meta?.title && <p className="mt-1 text-sm text-muted">{incoming.meta.title}</p>}
            <div className="mt-6 flex gap-2">
              <Button variant="primary" onClick={() => answer(true)} data-autofocus>
                {FRIENDS ? 'I’m in 🍿' : 'Accept ❤️'}
              </Button>
              <Button variant="ghost" onClick={() => answer(false)}>
                Not right now
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <AnimatePresence>
        {outgoing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full py-2 pl-4 pr-2 shadow-soft lg:bottom-6"
            role="status"
          >
            <span className="text-lg" aria-hidden>
              {ACTIVITY_META[outgoing.type]?.emoji}
            </span>
            <span className="text-sm text-cream">
              {outgoing.status === 'pending' && ACTIVITY_META[outgoing.type]?.waiting(w)}
              {outgoing.status === 'accepted' && `${w.Subject} said yes 🥹`}
              {outgoing.status === 'declined' && `${w.Subject} can’t right now`}
            </span>
            {outgoing.status === 'pending' ? (
              <span className="flex gap-1 pr-3" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-peach" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </span>
            ) : (
              <span className="pr-2" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
