import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Room from '../room/Room';
import Particles from '../interactions/Particles';
import { VideoBubbles } from './VideoCall';

/** The dance floor: warm light, both avatars close, hearts drifting up. */
export default function DanceRoom({ dancing, environment = 'rooftop', children }) {
  const [beat, setBeat] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (!dancing) return;
    const t = setInterval(() => setBeat((b) => b + 1), 3800);
    return () => clearInterval(t);
  }, [dancing]);
  return (
    <div ref={ref} className="relative">
      <Room environment={environment} mode={dancing ? 'dance' : 'mini'} showFurniture={false} showPet={false} className="aspect-[4/5] rounded-4xl ring-1 ring-line sm:aspect-[16/9]" avatarScale={dancing ? 1.08 : 1}>
        <AnimatePresence>
          {dancing && (
            <motion.div key="glow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 2 }} className="pointer-events-none absolute inset-0 z-10" aria-hidden>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_75%,rgba(242,201,139,0.35),transparent_55%)]" />
              <motion.div className="absolute left-1/2 top-0 h-full w-[46%] -translate-x-1/2 bg-gradient-to-b from-lamp/20 to-transparent blur-2xl" animate={{ opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 6, repeat: Infinity }} />
            </motion.div>
          )}
        </AnimatePresence>
        {dancing && <Particles runKey={beat} type={beat % 2 ? 'hearts' : 'dance'} from={{ x: 50, y: 42 }} count={7} />}
        {children}
      </Room>
      <VideoBubbles containerRef={ref} className="right-4 top-16" />
    </div>
  );
}
