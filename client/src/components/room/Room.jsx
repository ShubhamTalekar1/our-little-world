import { lazy, Suspense, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Trash } from 'lucide-react';
import RoomSvg from './RoomSvg';
import Particles from '../interactions/Particles';
import { hasWebGL } from '../avatar/chibi/stage';
import { useRoomStore } from '../../stores/roomStore';
import { useAvatarStore } from '../../stores/avatarStore';
import { usePeopleStore } from '../../stores/peopleStore';
import { usePresenceStore } from '../../stores/presenceStore';
import { useUiStore } from '../../stores/uiStore';
import { usePetStore } from '../../stores/petStore';
import { useCheckinStore } from '../../stores/checkinStore';
import { INTERACTIONS_BY_ID } from '../../catalog/interactions';
import { MOODS_BY_ID } from '../../catalog/moods';
import { FURNITURE_BY_ID } from '../../catalog/furniture';
import { usePartnerWords } from '../../lib/words';
import { isSameDay } from '../../lib/time';
import { cn } from '../../lib/cn';
import { isEnabled } from '../../config/features';
import { AVATAR_ME, AVATAR_HER } from '../../data/defaultAvatars';

const World3D = lazy(() => import('../world3d/World3D'));

/**
 * The shared space. A real 3D scene (environment, both chibis, decorations,
 * pet) with a few HTML overlays that follow the characters. Devices without
 * WebGL get the older 2D room.
 *
 * mode: 'home' (default) | 'dance' | 'mini'
 */
export default function Room(props) {
  if (!hasWebGL()) return <RoomSvg {...props} />;
  return <Room3D {...props} />;
}

function Room3D({ environment: envOverride, mode = 'home', decorating = false, showFurniture = true, showPet = true, className = '', children }) {
  const storeEnv = useRoomStore((s) => s.environment);
  const placed = useRoomStore((s) => s.placed);
  const move = useRoomStore((s) => s.move);
  const remove = useRoomStore((s) => s.remove);
  const myId = useAvatarStore((s) => s.myId);
  const avatars = useAvatarStore((s) => s.avatars);
  const partner = usePeopleStore((s) => s.partner);
  const presence = usePresenceStore((s) => s.partner);
  const interaction = useUiStore((s) => s.interaction);
  const pet = usePetStore((s) => s.pet);
  const play = usePetStore((s) => s.play);
  const checkins = useCheckinStore((s) => s.checkins);
  const reduced = useReducedMotion();
  const w = usePartnerWords();
  const anchors = useRef({ me: [40, 30], partner: [60, 30] });
  const bubbleRef = useRef(null);
  const labelRef = useRef(null);
  const [selected, setSelected] = useState(null);

  const env = envOverride ?? storeEnv;
  const partnerHere = presence.status !== 'offline';
  const ix = interaction ? INTERACTIONS_BY_ID[interaction.id] : null;

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
  const close = mode === 'dance' || (ix?.together && partnerHere);
  const myX = close ? -0.52 : -0.8;
  const partnerX = close ? 0.52 : 0.8;
  const mood = checkins.find((c) => c.userId === partner?.id && isSameDay(c.at, Date.now()));
  const furniture = showFurniture && env === 'bedroom' ? placed : [];
  const sel = placed.find((p) => p.uid === selected);

  // Where the hearts start/end: read the projected head positions at the moment of the interaction.
  const a = anchors.current;
  const from = interaction?.by === 'me' ? a.meChest ?? a.me : a.partnerChest ?? a.partner;
  const to = interaction?.by === 'me' ? a.partner : a.me;

  return (
    <div className={cn('relative isolate overflow-hidden bg-night', className)}>
      <Suspense fallback={<div className="absolute inset-0 animate-pulse bg-gradient-to-b from-surface-2 to-night" />}>
        <div className="absolute inset-0">
          <World3D
            environment={env}
            mode={mode}
            me={{ config: avatars[myId] ?? AVATAR_ME, pose: myPose, expression: myExpr, x: myX }}
            partner={{ config: avatars[partner?.id] ?? AVATAR_HER, pose: partnerHere ? partnerPose : 'idle', expression: partnerHere ? partnerExpr : 'happy', x: partnerX, visible: partnerHere }}
            furniture={furniture}
            pet={showPet && isEnabled('world') && env === 'bedroom' ? pet : null}
            decorating={decorating}
            selected={selected}
            onSelect={setSelected}
            onMove={move}
            onPetClick={() => play()}
            anchors={anchors}
            bubbleRef={bubbleRef}
            labelRef={labelRef}
            motion={!reduced}
          />
        </div>
      </Suspense>

      {mode === 'dance' && <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-lamp/15 via-transparent to-transparent mix-blend-screen" aria-hidden />}

      {/* follows the partner's head */}
      <AnimatePresence>
        {partnerHere && mood && mode === 'home' && !ix && (
          <motion.div
            ref={bubbleRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="glass pointer-events-none absolute z-20 grid h-9 w-9 -translate-x-1/2 -translate-y-full place-items-center rounded-full rounded-bl-md text-lg shadow-soft"
            title={`${w.Theyre} feeling ${MOODS_BY_ID[mood.mood]?.label.toLowerCase()}`}
          >
            {MOODS_BY_ID[mood.mood]?.emoji}
          </motion.div>
        )}
      </AnimatePresence>
      {!partnerHere && mode !== 'mini' && (
        <div ref={labelRef} className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full text-center">
          <span className="hand whitespace-nowrap text-xl text-cream/80 drop-shadow">Waiting for you…</span>
        </div>
      )}

      {ix?.particles && (
        <Particles runKey={interaction.key} type={ix.particles} from={{ x: from[0], y: from[1] }} to={ix.particles === 'stream' || ix.particles === 'kiss' ? { x: to[0], y: to[1] + 8 } : undefined} count={ix.particles === 'stream' ? 10 : 12} />
      )}

      {/* accessible controls for the selected decoration */}
      {decorating && sel && (
        <div className="glass absolute bottom-3 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full p-1.5 shadow-soft" role="toolbar" aria-label={`Move ${FURNITURE_BY_ID[sel.id]?.name}`}>
          <span className="px-2 text-xs text-cream-dim">{FURNITURE_BY_ID[sel.id]?.name}</span>
          {[
            [ArrowLeft, 'left', -3, 0],
            [ArrowUp, FURNITURE_BY_ID[sel.id]?.layer === 'wall' ? 'up' : 'back', 0, -3],
            [ArrowDown, FURNITURE_BY_ID[sel.id]?.layer === 'wall' ? 'down' : 'forward', 0, 3],
            [ArrowRight, 'right', 3, 0],
          ].map(([Icon, label, dx, dy]) => (
            <button key={label} onClick={() => move(sel.uid, sel.x + dx, sel.y + dy)} className="grid h-8 w-8 place-items-center rounded-full text-cream hover:bg-surface-3" aria-label={`Move ${label}`}>
              <Icon className="h-4 w-4" />
            </button>
          ))}
          <button
            onClick={() => {
              remove(sel.uid);
              setSelected(null);
            }}
            className="grid h-8 w-8 place-items-center rounded-full text-rose hover:bg-rose/15"
            aria-label="Remove"
          >
            <Trash className="h-4 w-4" />
          </button>
        </div>
      )}

      {children}
    </div>
  );
}
