import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import AppShell from './components/layout/AppShell';
import Toaster from './components/ui/Toaster';
import Spinner from './components/ui/Spinner';
import { useAuthStore } from './stores/authStore';
import { useSettingsStore } from './stores/settingsStore';

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
            <Route path="avatar" element={<AvatarPage />} />
            <Route path="wardrobe" element={<Wardrobe />} />
            <Route path="gifts" element={<Gifts />} />
            <Route path="chat" element={<Chat />} />
            <Route path="together" element={<Together />} />
            <Route path="together/movie" element={<MovieNight />} />
            <Route path="together/dance" element={<SlowDance />} />
            <Route path="together/music" element={<MusicRoom />} />
            <Route path="together/call" element={<CallRoom />} />
            <Route path="date-night" element={<DateNight />} />
            <Route path="memories" element={<Memories />} />
            <Route path="letters" element={<Letters />} />
            <Route path="dates" element={<Dates />} />
            <Route path="world" element={<OurWorld />} />
            <Route path="story" element={<Story />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
      <Toaster />
    </MotionConfig>
  );
}
