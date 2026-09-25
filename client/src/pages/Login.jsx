import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Rooftop from '../components/room/scenes/Rooftop';
import { useAuthStore } from '../stores/authStore';
import { DEMO_MODE } from '../config/env';

export default function Login() {
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    if (await login(email, password)) navigate('/', { replace: true });
  };
  return (
    <div className="relative grid min-h-dvh place-items-center px-4">
      <div className="fixed inset-0 -z-10" aria-hidden>
        <Rooftop />
        <div className="absolute inset-0 bg-ink/60 backdrop-blur-[2px]" />
      </div>
      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass w-full max-w-sm rounded-4xl p-7 shadow-soft">
        <p className="eyebrow">Our little world</p>
        <h1 className="mt-2 text-3xl font-light text-cream">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Good to see you again.</p>
        <div className="mt-6 flex flex-col gap-3">
          <div>
            <label htmlFor="email" className="eyebrow mb-1.5 block">Email</label>
            <input id="email" type="email" autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="password" className="eyebrow mb-1.5 block">Password</label>
            <input id="password" type="password" autoComplete="current-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-rose" role="alert">{error}</p>}
          <Button type="submit" variant="primary" size="lg" loading={loading} className="mt-2">
            Come home
          </Button>
        </div>
        <p className="mt-5 text-center text-xs text-muted">
          New here? <Link to="/welcome" className="text-peach hover:underline">Start your world</Link> · <Link to="/join" className="text-peach hover:underline">I have a code</Link>
        </p>
        {DEMO_MODE && <p className="mt-3 text-center text-[11px] text-faint">Demo mode: any details work.</p>}
      </motion.form>
    </div>
  );
}
