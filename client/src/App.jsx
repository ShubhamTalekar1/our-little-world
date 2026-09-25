import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import AppShell from './components/layout/AppShell';
import Toaster from './components/ui/Toaster';
import Spinner from './components/ui/Spinner';
import { useAuthStore } from './stores/authStore';
import { useSettingsStore } from './stores/settingsStore';
import FeatureGate from './components/layout/FeatureGate';

const Home = lazy(() => import('./pages/Home'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Login = lazy(() => import('./pages/Login'));
const AvatarPage = lazy(() => import('./pages/AvatarPage'));
const Wardrobe = lazy(() => import('./pages/Wardrobe'));
const Gifts = lazy(() => import('./pages/Gifts'));
const Chat = lazy(() => import('./pages/Chat'));
const Together = lazy(() => import('./pages/Together'));
const MovieNight = lazy(() => import('./pages/MovieNight'));
const SlowDance = lazy(() => import('./pages/SlowDance'));
const MusicRoom = lazy(() => import('./pages/MusicRoom'));
const CallRoom = lazy(() => import('./pages/CallRoom'));
const DateNight = lazy(() => import('./pages/DateNight'));
const Memories = lazy(() => import('./pages/Memories'));
const Letters = lazy(() => import('./pages/Letters'));
const Dates = lazy(() => import('./pages/Dates'));
const OurWorld = lazy(() => import('./pages/OurWorld'));
const Story = lazy(() => import('./pages/Story'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

function RequireWorld({ children }) {
  const status = useAuthStore((s) => s.status);
  if (status === 'new') return <Navigate to="/welcome" replace />;
  if (status === 'signedOut') return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const reduced = useSettingsStore((s) => s.reducedMotion);
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = reduced === 'on' ? 'true' : 'false';
  }, [reduced]);
  return (
    <MotionConfig reducedMotion={reduced === 'on' ? 'always' : reduced === 'off' ? 'never' : 'user'}>
      <Suspense fallback={<Spinner label="Opening the door" />}>
        <Routes>
          <Route path="/welcome" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/join" element={<Onboarding joining />} />
          <Route
            element={
              <RequireWorld>
                <AppShell />
              </RequireWorld>
            }
          >
            <Route index element={<Home />} />
            <Route path="avatar" element={<FeatureGate name="avatar"><AvatarPage /></FeatureGate>} />
            <Route path="wardrobe" element={<FeatureGate name="wardrobe"><Wardrobe /></FeatureGate>} />
            <Route path="gifts" element={<FeatureGate name="gifts"><Gifts /></FeatureGate>} />
            <Route path="chat" element={<FeatureGate name="chat"><Chat /></FeatureGate>} />
            <Route path="together" element={<Together />} />
            <Route path="together/movie" element={<FeatureGate name="movie"><MovieNight /></FeatureGate>} />
            <Route path="together/dance" element={<FeatureGate name="dance"><SlowDance /></FeatureGate>} />
            <Route path="together/music" element={<FeatureGate name="music"><MusicRoom /></FeatureGate>} />
            <Route path="together/call" element={<FeatureGate name="call"><CallRoom /></FeatureGate>} />
            <Route path="date-night" element={<FeatureGate name="date"><DateNight /></FeatureGate>} />
            <Route path="memories" element={<FeatureGate name="memories"><Memories /></FeatureGate>} />
            <Route path="letters" element={<FeatureGate name="letters"><Letters /></FeatureGate>} />
            <Route path="dates" element={<FeatureGate name="dates"><Dates /></FeatureGate>} />
            <Route path="world" element={<FeatureGate name="world"><OurWorld /></FeatureGate>} />
            <Route path="story" element={<FeatureGate name="story"><Story /></FeatureGate>} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
      <Toaster />
    </MotionConfig>
  );
}
