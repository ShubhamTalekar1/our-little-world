import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import MoreSheet from './MoreSheet';
import NotificationCenter from '../notifications/NotificationCenter';
import GiftOpeningModal from '../gifts/GiftOpeningModal';
import GiftSendAnimation from '../gifts/GiftSendAnimation';
import InvitationLayer from '../activities/InvitationLayer';
import CallPill from '../activities/CallPill';
import Spinner from '../ui/Spinner';
import DemoBanner from './DemoBanner';
import { useWorldRuntime } from '../../hooks/useWorldRuntime';

export default function AppShell() {
  useWorldRuntime();
  const location = useLocation();
  const immersive = /^\/(together\/(movie|dance|call))|^\/date-night\/live/.test(location.pathname);
  return (
    <div className="flex min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-xl focus:bg-cream focus:px-4 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <DemoBanner />
        <main id="main" className={`mx-auto w-full flex-1 ${immersive ? 'max-w-7xl px-3 py-4 sm:px-6' : 'max-w-6xl px-4 py-6 sm:px-6 sm:py-8'} pb-32 lg:pb-12`}>
          <Suspense fallback={<Spinner label="Opening the door" />}>
            {/* Enter-only page transition. (An exit animation with AnimatePresence could
                remount the current page later on — e.g. mid-movie — resetting it.) */}
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: 'easeOut' }}>
              <Outlet />
            </motion.div>
          </Suspense>
        </main>
      </div>
      <BottomNav />
      <MoreSheet />
      <NotificationCenter />
      <InvitationLayer />
      <CallPill />
      <GiftSendAnimation />
      <GiftOpeningModal />
    </div>
  );
}
