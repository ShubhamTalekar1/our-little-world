import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, ArrowRight, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import Avatar from '../components/avatar/Avatar';
import AvatarCustomizer from '../components/avatar/AvatarCustomizer';
import Bedroom from '../components/room/scenes/Bedroom';
import { Motes } from '../components/room/effects';
import { useAuthStore } from '../stores/authStore';
import { usePeopleStore } from '../stores/peopleStore';
import { useAvatarStore } from '../stores/avatarStore';
import { toast } from '../stores/uiStore';
import { AVATAR_ME, AVATAR_HER } from '../data/defaultAvatars';
import { DEMO_MODE } from '../config/env';
import { makeInviteCode, normalizeInviteCode, isInviteCode, INVITE_EXAMPLE } from '../lib/inviteCode';
import { api } from '../services/api/client';
import { cn } from '../lib/cn';
import { FRIENDS } from '../config/features';

function Backdrop({ dim = 0.6 }) {
  return (
    <div className="fixed inset-0 -z-10" aria-hidden>
      <Bedroom />
      <Motes count={16} />
      <div className="absolute inset-0 backdrop-blur-[2px]" style={{ background: `rgba(10,10,16,${dim})` }} />
    </div>
  );
}

function Dots({ step, total }) {
  return (
    <div className="flex justify-center gap-1.5" aria-label={`Step ${step + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <motion.span key={i} className="h-1.5 rounded-full bg-cream" animate={{ width: i === step ? 22 : 6, opacity: i === step ? 0.9 : 0.25 }} />
      ))}
    </div>
  );
}

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 }, transition: { duration: 0.5, ease: 'easeOut' } };

export default function Onboarding({ joining = false }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [avatar, setAvatar] = useState(() => (joining ? AVATAR_HER : AVATAR_ME));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [since, setSince] = useState(() => new Date().toISOString().slice(0, 10));
  const [pronouns, setPronouns] = useState(joining ? 'he' : 'she');
  const [code, setCode] = useState(() => new URLSearchParams(window.location.search).get('code') ?? '');
  const joinCode = code;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const localCode = useMemo(() => makeInviteCode(), []);
  const [serverCode, setServerCode] = useState(null);
  const inviteCode = serverCode ?? localCode;
  const register = useAuthStore((s) => s.register);
  const inviteLink = `${window.location.origin}/join?code=${inviteCode}`;

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  const createAccount = async () => {
    setError(null);
    if (!name.trim()) return setError('What should we call you?');
    if (DEMO_MODE) return next();
    if (!email.includes('@') || password.length < 8) return setError('Use a real email and a password of at least 8 characters');
    setBusy(true);
    const res = await register({ name, email, password, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, inviteCode: joining ? normalizeInviteCode(joinCode) : undefined });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    if (res.couple?.inviteCode) setServerCode(res.couple.inviteCode);
    await api.put('/avatars/me', { config: avatar }).catch(() => {});
    next();
  };

  const finish = () => {
    if (DEMO_MODE) {
      const people = usePeopleStore.getState();
      people.updateMe({ name: name.trim() || 'You' });
      people.updatePartner({ name: partnerName.trim() || 'Them', pronouns });
      if (!joining) people.updateCouple({ inviteCode });
      people.updateCouple({ since: new Date(since).toISOString(), anniversary: new Date(since).toISOString() });
      const av = useAvatarStore.getState();
      av.setAvatar(av.myId, avatar);
      if (joining) av.setAvatar(people.partner.id, AVATAR_ME);
    }
    useAuthStore.getState().completeOnboarding(useAuthStore.getState().userId ?? 'u_me');
    navigate('/', { replace: true });
  };

  const steps = [
    // 1 — welcome
    <motion.div key="welcome" {...fade} className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
      <motion.p initial={{ opacity: 0, letterSpacing: '0.6em' }} animate={{ opacity: 1, letterSpacing: '0.35em' }} transition={{ duration: 1.6 }} className="text-[11px] uppercase text-muted">
        a private place for two
      </motion.p>
      <h1 className="mt-5 text-5xl font-light leading-tight text-cream sm:text-6xl">
        Welcome to <span className="italic text-peach">our</span>
        <br />
        little world.
      </h1>
      <p className="mt-5 max-w-md text-muted">Even when you’re far apart, you can open this little world and spend time together.</p>
      <Button variant="primary" size="lg" className="mt-10" onClick={next} data-autofocus>
        Come in
      </Button>
      {!joining && (
        <p className="mt-6 text-sm text-muted">
          Have an invite code?{' '}
          <Link to="/join" className="text-peach hover:underline">
            {FRIENDS ? 'Join your friend' : 'Join your person'}
          </Link>
          {!DEMO_MODE && (
            <>
              {' '}
              · <Link to="/login" className="text-peach hover:underline">Log in</Link>
            </>
          )}
        </p>
      )}
    </motion.div>,

    // 2 — create yourself
    <motion.div key="create" {...fade}>
      <div className="mb-6 text-center">
        <p className="eyebrow">{joining ? 'Step two' : 'Step one'}</p>
        <h1 className="mt-2 text-4xl font-light text-cream">Create yourself.</h1>
      </div>
      <div className="glass rounded-4xl p-4 sm:p-6">
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="ob-name" className="eyebrow mb-1.5 block">Your name</label>
            <input id="ob-name" className="field" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="What should we call you?" />
          </div>
          {!DEMO_MODE && (
            <>
              <div>
                <label htmlFor="ob-email" className="eyebrow mb-1.5 block">Email</label>
                <input id="ob-email" type="email" autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label htmlFor="ob-pw" className="eyebrow mb-1.5 block">Password</label>
                <input id="ob-pw" type="password" autoComplete="new-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ characters" />
              </div>
            </>
          )}
        </div>
        <AvatarCustomizer value={avatar} onChange={setAvatar} tabs={['body', 'hair', 'face', 'clothing', 'looks']} />
      </div>
      {error && <p className="mt-3 text-center text-sm text-rose" role="alert">{error}</p>}
      <div className="mt-6 flex justify-between">
        <Button variant="ghost" icon={ArrowLeft} onClick={back}>Back</Button>
        <Button variant="primary" onClick={createAccount} loading={busy}>
          That’s me <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>,

    // 3 — invite / join
    joining ? (
      <motion.div key="join" {...fade} className="mx-auto max-w-md text-center">
        <p className="eyebrow">Step one</p>
        <h1 className="mt-2 text-4xl font-light text-cream">Find your person.</h1>
        <p className="mt-3 text-muted">Enter the code they gave you.</p>
        <label htmlFor="ob-code" className="sr-only">Invite code</label>
        <input id="ob-code" className="field mt-6 text-center font-mono text-xl tracking-[0.3em] uppercase" placeholder={INVITE_EXAMPLE.replace('7K4P', 'XXXX')} value={code} onChange={(e) => setCode(e.target.value)} />
        <div className="mt-4 grid grid-cols-2 gap-3 text-left">
          <div>
            <label htmlFor="ob-pn" className="eyebrow mb-1.5 block">Their name</label>
            <input id="ob-pn" className="field" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="ob-pp" className="eyebrow mb-1.5 block">Pronouns</label>
            <select id="ob-pp" className="field" value={pronouns} onChange={(e) => setPronouns(e.target.value)}>
              <option value="she">she / her</option>
              <option value="he">he / him</option>
              <option value="they">they / them</option>
            </select>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-rose" role="alert">{error}</p>}
        <div className="mt-8 flex justify-between">
          <Button variant="ghost" icon={ArrowLeft} onClick={back}>Back</Button>
          <Button variant="primary" onClick={() => (!DEMO_MODE && !isInviteCode(code) ? setError(`That code should look like ${INVITE_EXAMPLE}`) : (setError(null), next()))}>
            Join our world <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    ) : (
      <motion.div key="invite" {...fade} className="mx-auto max-w-md text-center">
        <p className="eyebrow">Step two</p>
        <h1 className="mt-2 text-4xl font-light text-cream">{FRIENDS ? 'Invite your friend.' : 'Invite your person.'}</h1>
        <p className="mt-3 text-muted">This world only ever has room for two. Send them this code:</p>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: 'spring' }} className="glass mx-auto mt-6 rounded-3xl px-6 py-5">
          <p className="font-mono text-3xl tracking-[0.25em] text-cream">{inviteCode}</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button size="sm" icon={Copy} onClick={() => { navigator.clipboard?.writeText(inviteCode).catch(() => {}); toast('Code copied', { emoji: '📋' }); }}>
              Copy code
            </Button>
            <Button size="sm" icon={Copy} onClick={() => { navigator.clipboard?.writeText(inviteLink).catch(() => {}); toast('Private link copied', { emoji: '🔗' }); }}>
              Copy link
            </Button>
          </div>
        </motion.div>
        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          <div>
            <label htmlFor="ob-pn" className="eyebrow mb-1.5 block">What do you call them?</label>
            <input id="ob-pn" className="field" value={partnerName} maxLength={40} onChange={(e) => setPartnerName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="ob-pp" className="eyebrow mb-1.5 block">Pronouns</label>
            <select id="ob-pp" className="field" value={pronouns} onChange={(e) => setPronouns(e.target.value)}>
              <option value="she">she / her</option>
              <option value="he">he / him</option>
              <option value="they">they / them</option>
            </select>
          </div>
        </div>
        {!FRIENDS && (
          <div className="mt-3 text-left">
            <label htmlFor="ob-since" className="eyebrow mb-1.5 block">Together since</label>
            <input id="ob-since" type="date" className="field" value={since} max={new Date().toISOString().slice(0, 10)} onChange={(e) => e.target.value && setSince(e.target.value)} />
          </div>
        )}
        {DEMO_MODE && <p className="mt-4 text-xs text-muted">In the demo, a simulated person joins right away so you can look around.</p>}
        <div className="mt-8 flex justify-between">
          <Button variant="ghost" icon={ArrowLeft} onClick={back}>Back</Button>
          <Button variant="primary" onClick={next}>
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    ),

    // 4 — memories
    <motion.div key="memories" {...fade} className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
      <div className="relative flex items-end gap-2">
        <motion.div initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 60 }}>
          <Avatar config={avatar} size={230} pose={FRIENDS ? 'wave' : 'hug'} expression={FRIENDS ? 'happy' : 'love'} />
        </motion.div>
        <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.35, type: 'spring', stiffness: 60 }}>
          <Avatar config={joining ? AVATAR_ME : AVATAR_HER} size={230} pose={FRIENDS ? 'wave' : 'hug'} expression={FRIENDS ? 'happy' : 'love'} flip />
        </motion.div>
        {(FRIENDS ? ['🍿', '✨', '🎬'] : ['❤️', '✨', '🤍']).map((h, i) => (
          <motion.span key={i} className="absolute left-1/2 text-2xl" style={{ top: 10 }} initial={{ opacity: 0, y: 0 }} animate={{ opacity: [0, 1, 0], y: -70, x: (i - 1) * 30 }} transition={{ delay: 1 + i * 0.3, duration: 2.2, repeat: Infinity, repeatDelay: 1.5 }} aria-hidden>
            {h}
          </motion.span>
        ))}
      </div>
      <h1 className="mt-8 text-5xl font-light text-cream">{FRIENDS ? 'Grab some popcorn.' : 'Now make some memories.'}</h1>
      <p className="mt-3 max-w-md text-muted">{FRIENDS ? 'Movie nights and long chats — more will open up later.' : 'Movies, slow dances, silly gifts and letters for later. It’s all waiting.'}</p>
      <Button variant="primary" size="lg" className="mt-8" onClick={finish} data-autofocus>
        {FRIENDS ? 'Come in' : 'Enter our world ❤️'}
      </Button>
    </motion.div>,
  ];

  // People joining enter their code before creating an account (it links them
  // to the right world); people starting a world create themselves first.
  const ordered = joining ? [steps[0], steps[2], steps[1], steps[3]] : steps;
  const createStep = joining ? 2 : 1;

  return (
    <div className="relative min-h-dvh px-4 py-8 sm:px-6">
      <Backdrop dim={step === createStep ? 0.82 : 0.55} />
      <div className={cn('mx-auto', step === createStep ? 'max-w-6xl' : 'max-w-3xl')}>
        <Dots step={step} total={ordered.length} />
        <div className="mt-6">
          <AnimatePresence mode="wait">{ordered[step]}</AnimatePresence>
        </div>
      </div>
    </div>
  );
}
