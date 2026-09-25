import { AnimatePresence, motion } from 'framer-motion';
import { SCENES } from './scenes';
import { Motes } from './effects';
import RoomObject from './RoomObject';
import Avatar from '../avatar/Avatar';
import PetSprite from '../pet/PetSprite';
import Particles from '../interactions/Particles';
import { useElementSize } from '../../hooks/useElementSize';
import { useRoomStore } from '../../stores/roomStore';
import { useAvatarStore } from '../../stores/avatarStore';
import { usePeopleStore } from '../../stores/peopleStore';
import { usePresenceStore } from '../../stores/presenceStore';
import { useUiStore } from '../../stores/uiStore';
import { usePetStore } from '../../stores/petStore';
import { useCheckinStore } from '../../stores/checkinStore';
import { INTERACTIONS_BY_ID } from '../../catalog/interactions';
import { MOODS_BY_ID } from '../../catalog/moods';
import { usePartnerWords } from '../../lib/words';
import { isSameDay } from '../../lib/time';
import { cn } from '../../lib/cn';

const AMBIENCE = {
  bedroom: { motes: '#F2C98B', count: 14 },
  rooftop: { motes: '#FFE2A8', count: 8 },
  beach: { motes: '#FFE2B0', count: 10 },
  cafe: { motes: '#F2C98B', count: 10 },
  stargazing: { motes: '#C9F0B0', count: 22 }, // fireflies
  campfire: { motes: '#FFB070', count: 16 },
  theater: { motes: '#8FB3D9', count: 8 },
};

/**
 * The shared space. Renders an environment, decorations, both avatars, the
 * pet and whatever little interaction is currently happening.
 *
 * mode: 'home' (default) | 'dance' | 'mini'
 */
export default function Room({
  environment: envOverride,
  mode = 'home',
  decorating = false,
  showFurniture = true,
  showPet = true,
  className = '',
  children,
  avatarScale = 1,
  overridePoses,
}) {
  const [ref, size] = useElementSize();
  const storeEnv = useRoomStore((s) => s.environment);
  const placed = useRoomStore((s) => s.placed);
  const move = useRoomStore((s) => s.move);
  const remove = useRoomStore((s) => s.remove);
  const myId = useAvatarStore((s) => s.myId);
  const avatars = useAvatarStore((s) => s.avatars);
  const partner = usePeopleStore((s) => s.partner);
  const me = usePeopleStore((s) => s.me);
  const presence = usePresenceStore((s) => s.partner);
  const interaction = useUiStore((s) => s.interaction);
  const pet = usePetStore((s) => s.pet);
  const checkins = useCheckinStore((s) => s.checkins);
  const w = usePartnerWords();

  const env = envOverride ?? storeEnv;
  const Scene = SCENES[env] ?? SCENES.bedroom;
  const amb = AMBIENCE[env] ?? AMBIENCE.bedroom;
  const partnerHere = presence.status !== 'offline';
  const ix = interaction ? INTERACTIONS_BY_ID[interaction.id] : null;

  // Poses
  let myPose = 'idle';
  let partnerPose = 'idle';
  let myExpr = null;
  let partnerExpr = null;
  if (mode === 'dance') {
    myPose = partnerPose = 'dance';
    myExpr = partnerExpr = 'love';
  }
  if (ix) {
    if (interaction.by === 'me') {
      myPose = ix.pose;
      myExpr = ix.expression;
      partnerPose = partnerHere ? ix.partnerPose : 'idle';
      partnerExpr = partnerHere ? ix.partnerExpression ?? null : null;
    } else {
      partnerPose = ix.pose;
      partnerExpr = ix.expression;
      myPose = ix.partnerPose;
      myExpr = ix.partnerExpression ?? null;
    }
  }
  if (overridePoses) ({ myPose = myPose, partnerPose = partnerPose, myExpr = myExpr, partnerExpr = partnerExpr } = overridePoses);

  const close = mode === 'dance' || (ix?.together && partnerHere);
  // 3D chibis have big heads — "close" still leaves room between them.
  const myX = close ? (mode === 'dance' ? 43 : 42.5) : 37;
  const partnerX = close ? (mode === 'dance' ? 57 : 57.5) : 63;
  const floorY = mode === 'mini' ? 96 : 94;
  const narrow = size.width < 520;
  const avatarH = Math.max(90, size.height * (mode === 'mini' ? 0.62 : narrow ? 0.46 : 0.56) * avatarScale);
  const scale = Math.max(0.55, Math.min(1.4, size.width / 900));

  const partnerMood = checkins.find((c) => c.userId === partner?.id && isSameDay(c.at, Date.now()));

  return (
    <div ref={ref} className={cn('relative isolate overflow-hidden', className)}>
      <Scene />
      <Motes count={amb.count} color={amb.motes} area={env === 'stargazing' ? 'all' : 'bottom'} />
      {mode === 'dance' && <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-lamp/20 via-peach/5 to-transparent mix-blend-screen" aria-hidden />}

      {showFurniture &&
        env === 'bedroom' &&
        placed.map((item) => (
          <RoomObject key={item.uid} item={item} scale={scale} decorating={decorating} containerRef={ref} onMove={move} onRemove={remove} />
        ))}

      {showPet && pet.adopted && (
        <div className="absolute z-20" style={{ left: '22%', bottom: '4%' }}>
          <PetSprite species={pet.species} accessory={pet.accessory} size={Math.max(46, size.height * 0.13)} mood={pet.hunger < 25 ? 'sleepy' : 'happy'} label={`${pet.name} the ${pet.species}`} />
        </div>
      )}

      {/* avatars */}
      <motion.div
        className="absolute z-20 -translate-x-1/2"
        initial={false}
        animate={{ left: `${myX}%` }}
        transition={{ type: 'spring', stiffness: 60, damping: 16 }}
        style={{ bottom: `${100 - floorY}%` }}
      >
        <Avatar config={avatars[myId]} size={avatarH} pose={myPose} expression={myExpr} label={`${me?.name ?? 'You'}’s avatar`} />
      </motion.div>

      <motion.div
        className="absolute z-20 -translate-x-1/2"
        initial={false}
        animate={{ left: `${partnerX}%`, opacity: partnerHere ? 1 : 0.28, filter: partnerHere ? 'saturate(1)' : 'saturate(0.2)' }}
        transition={{ type: 'spring', stiffness: 60, damping: 16 }}
        style={{ bottom: `${100 - floorY}%` }}
      >
        <div className="relative">
          <Avatar config={avatars[partner?.id]} size={avatarH} pose={partnerHere ? partnerPose : 'idle'} expression={partnerExpr} flip label={`${w.name}’s avatar`} />
          <AnimatePresence>
            {partnerHere && partnerMood && mode === 'home' && !ix && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="glass absolute -top-2 right-0 grid h-9 w-9 place-items-center rounded-full rounded-bl-md text-lg shadow-soft"
                title={`${w.Theyre} feeling ${MOODS_BY_ID[partnerMood.mood]?.label.toLowerCase()}`}
              >
                {MOODS_BY_ID[partnerMood.mood]?.emoji}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {!partnerHere && mode !== 'mini' && (
        <div className="absolute z-30 -translate-x-1/2 text-center" style={{ left: `${partnerX}%`, bottom: `${100 - floorY + (avatarH / Math.max(1, size.height)) * 100 + 2}%` }}>
          <span className="hand whitespace-nowrap text-xl text-cream/70">Waiting for you…</span>
        </div>
      )}

      {/* interaction particles */}
      {ix?.particles && (
        <Particles
          runKey={interaction.key}
          type={ix.particles}
          from={{ x: interaction.by === 'me' ? myX : partnerX, y: 100 - (avatarH / Math.max(1, size.height)) * 100 }}
          to={ix.particles === 'stream' || ix.particles === 'kiss' ? { x: interaction.by === 'me' ? partnerX : myX, y: 100 - (avatarH / Math.max(1, size.height)) * 90 } : undefined}
          count={ix.particles === 'stream' ? 10 : 12}
        />
      )}
      {mode === 'dance' && <Particles runKey="dance-loop" type="dance" from={{ x: 50, y: 40 }} count={6} />}

      {children}
    </div>
  );
}
