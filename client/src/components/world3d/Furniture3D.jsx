import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, StringLights, Flicker, mat, glowMat } from './kit';
import { FURNITURE_BY_ID } from '../../catalog/furniture';

// Room decorations as little 3D models. Positions are stored as percentages
// (so the data model is renderer-agnostic) and mapped into the room here.

export const WALL_Z = -2.93;
export function toWorld(item) {
  const f = FURNITURE_BY_ID[item.id];
  const x = ((item.x - 50) / 50) * 5.2;
  if (f?.layer === 'wall') return [x, Math.max(1.4, Math.min(4.4, 4.6 - (item.y / 100) * 4.4)), WALL_Z];
  const z = Math.max(-2.4, Math.min(1.2, -2.4 + ((item.y - 45) / 50) * 4.3));
  return [x, 0, z];
}
export function toPercent(id, [x, y, z]) {
  const f = FURNITURE_BY_ID[id];
  const px = (x / 5.2) * 50 + 50;
  if (f?.layer === 'wall') return [px, ((4.6 - y) / 4.4) * 100];
  return [px, ((z + 2.4) / 4.3) * 50 + 45];
}

function Candle({ position, h = 0.3 }) {
  const flame = useRef();
  useFrame(({ clock }) => {
    if (flame.current) flame.current.scale.y = 1 + Math.sin(clock.elapsedTime * 9 + position[0] * 5) * 0.15;
  });
  return (
    <group position={position}>
      <mesh position={[0, h / 2, 0]} material={mat('#F5EBDD')}>
        <cylinderGeometry args={[0.07, 0.07, h, 16]} />
      </mesh>
      <mesh ref={flame} position={[0, h + 0.06, 0]} material={glowMat('#FFD28A')}>
        <coneGeometry args={[0.035, 0.12, 10]} />
      </mesh>
    </group>
  );
}

const MODELS = {
  plant: () => (
    <group>
      <mesh position={[0, 0.25, 0]} material={mat('#B8664A')}>
        <cylinderGeometry args={[0.3, 0.22, 0.5, 20]} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[Math.sin(i * 2.4) * 0.28, 0.75 + (i % 3) * 0.2, Math.cos(i * 2.4) * 0.2]} rotation={[Math.cos(i) * 0.6, i, Math.sin(i * 2.4) * 0.7]} scale={[0.28, 0.05, 0.42]} material={mat(i % 2 ? '#5E8A60' : '#6f9c6f')}>
          <sphereGeometry args={[1, 16, 10]} />
        </mesh>
      ))}
    </group>
  ),
  lamp: () => (
    <group>
      <mesh position={[0, 0.03, 0]} material={mat('#3B2C2A')}>
        <cylinderGeometry args={[0.25, 0.28, 0.06, 20]} />
      </mesh>
      <mesh position={[0, 0.9, 0]} material={mat('#3B2C2A')}>
        <cylinderGeometry args={[0.03, 0.03, 1.8, 10]} />
      </mesh>
      <mesh position={[0, 1.95, 0]} material={glowMat('#FBE7C6')}>
        <sphereGeometry args={[0.36, 24, 18]} />
      </mesh>
      <Flicker position={[0, 1.95, 0.3]} intensity={4} distance={7} color="#ffc27a" speed={0.4} />
    </group>
  ),
  books: () => (
    <group>
      {[['#B8664A', 0.08, 0], ['#8FB3D9', 0.2, 0.2], ['#EFD58F', 0.31, -0.15], ['#9DB8A0', 0.41, 0.35]].map(([c, y, r], i) => (
        <Box key={i} size={[0.55, 0.11, 0.38]} color={c} position={[0, y, 0]} rotation={[0, r, 0]} />
      ))}
    </group>
  ),
  candles: () => (
    <group>
      <Candle position={[-0.12, 0, 0]} h={0.34} />
      <Candle position={[0.1, 0, 0.05]} h={0.24} />
      <Candle position={[0.02, 0, -0.12]} h={0.18} />
      <Flicker position={[0, 0.6, 0.1]} intensity={1.5} distance={3.5} color="#ffb46b" />
    </group>
  ),
  flowers: () => (
    <group>
      <mesh position={[0, 0.22, 0]} material={mat('#8FB3D9')}>
        <cylinderGeometry args={[0.12, 0.16, 0.44, 16]} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <group key={i} position={[Math.sin(i) * 0.12, 0.62 + (i % 2) * 0.1, Math.cos(i) * 0.1]}>
          <mesh position={[0, -0.12, 0]} material={mat('#6E8C70')}>
            <cylinderGeometry args={[0.01, 0.01, 0.25, 6]} />
          </mesh>
          <mesh material={mat(['#D98E96', '#F5EBDD', '#E8B4A0'][i % 3])}>
            <sphereGeometry args={[0.08, 14, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  ),
  teddy: () => (
    <group>
      <mesh position={[0, 0.3, 0]} material={mat('#C8A27A')}>
        <sphereGeometry args={[0.3, 20, 16]} />
      </mesh>
      <mesh position={[0, 0.72, 0.02]} material={mat('#C8A27A')}>
        <sphereGeometry args={[0.22, 20, 16]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.16, 0.9, 0]} material={mat('#B38a64')}>
          <sphereGeometry args={[0.08, 12, 10]} />
        </mesh>
      ))}
      <mesh position={[0, 0.68, 0.2]} material={mat('#E9D3B6')}>
        <sphereGeometry args={[0.08, 12, 10]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`e${s}`} position={[s * 0.08, 0.77, 0.19]} material={glowMat('#2A1E1C')}>
          <sphereGeometry args={[0.025, 8, 6]} />
        </mesh>
      ))}
      <mesh position={[0, 0.52, 0.15]} rotation={[0, 0, 0]} material={mat('#E8B4A0')}>
        <torusGeometry args={[0.08, 0.02, 8, 16]} />
      </mesh>
    </group>
  ),
  speaker: () => (
    <group>
      <Box size={[0.8, 0.3, 0.6]} color="#6B432E" position={[0, 0.15, 0]} />
      <mesh position={[-0.05, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#1a1418')}>
        <circleGeometry args={[0.25, 24]} />
      </mesh>
      <mesh position={[-0.05, 0.315, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#D98E96')}>
        <circleGeometry args={[0.07, 16]} />
      </mesh>
    </group>
  ),
  cactus: () => (
    <group>
      <mesh position={[0, 0.12, 0]} material={mat('#E8B4A0')}>
        <cylinderGeometry args={[0.16, 0.12, 0.24, 16]} />
      </mesh>
      <mesh position={[0, 0.45, 0]} material={mat('#6f9c6f')}>
        <capsuleGeometry args={[0.09, 0.3, 6, 12]} />
      </mesh>
      <mesh position={[0.12, 0.5, 0]} rotation={[0, 0, -0.9]} material={mat('#6f9c6f')}>
        <capsuleGeometry args={[0.05, 0.12, 6, 10]} />
      </mesh>
    </group>
  ),
  guitar: () => (
    <group rotation={[0, 0, 0.15]}>
      <mesh position={[0, 0.3, 0]} scale={[1, 1, 0.35]} material={mat('#C8864A')}>
        <sphereGeometry args={[0.3, 20, 16]} />
      </mesh>
      <mesh position={[0, 0.65, 0]} scale={[1, 1, 0.35]} material={mat('#C8864A')}>
        <sphereGeometry args={[0.22, 20, 16]} />
      </mesh>
      <Box size={[0.08, 0.8, 0.05]} color="#5A3B2C" position={[0, 1.15, 0]} />
      <mesh position={[0, 0.45, 0.11]} material={mat('#3b2c2a')}>
        <circleGeometry args={[0.08, 16]} />
      </mesh>
    </group>
  ),
  globe: () => (
    <group>
      <mesh position={[0, 0.03, 0]} material={mat('#6B432E')}>
        <cylinderGeometry args={[0.16, 0.18, 0.06, 16]} />
      </mesh>
      <mesh position={[0, 0.2, 0]} material={mat('#6B432E')}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
      </mesh>
      <mesh position={[0, 0.5, 0]} material={mat('#8FB3D9')}>
        <sphereGeometry args={[0.22, 24, 16]} />
      </mesh>
      <mesh position={[0.06, 0.55, 0.1]} scale={[1, 0.7, 0.6]} material={mat('#9DB8A0')}>
        <sphereGeometry args={[0.13, 12, 10]} />
      </mesh>
    </group>
  ),
  'cat-bed': () => (
    <group>
      <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat('#C8A27A')}>
        <torusGeometry args={[0.38, 0.12, 12, 28]} />
      </mesh>
      <mesh position={[0, 0.05, 0]} material={mat('#F5EBDD')}>
        <cylinderGeometry args={[0.36, 0.36, 0.08, 24]} />
      </mesh>
    </group>
  ),
  frame: () => (
    <group>
      <Box size={[1.0, 0.8, 0.06]} color="#C8A27A" />
      <mesh position={[0, 0, 0.035]} material={mat('#E8B4A0')}>
        <planeGeometry args={[0.82, 0.62]} />
      </mesh>
      <mesh position={[-0.12, -0.05, 0.04]} material={mat('#5A4B72')}>
        <circleGeometry args={[0.13, 16]} />
      </mesh>
      <mesh position={[0.14, -0.08, 0.04]} material={mat('#9DB8A0')}>
        <circleGeometry args={[0.11, 16]} />
      </mesh>
    </group>
  ),
  poster: () => (
    <group>
      <mesh material={mat('#1d2340')}>
        <planeGeometry args={[0.9, 1.25]} />
      </mesh>
      <mesh position={[0, 0.12, 0.01]} material={glowMat('#F5EBDD')}>
        <circleGeometry args={[0.28, 32]} />
      </mesh>
      <mesh position={[0.1, 0.18, 0.012]} material={mat('#1d2340')}>
        <circleGeometry args={[0.26, 32]} />
      </mesh>
    </group>
  ),
};

function FairyLights() {
  return (
    <group>
      <StringLights from={[-6.5, 4.9, -2.85]} to={[0, 4.6, -2.85]} sag={0.55} count={16} />
      <StringLights from={[0, 4.6, -2.85]} to={[6.5, 4.9, -2.85]} sag={0.55} count={16} />
    </group>
  );
}

export default function Furniture3D({ item, selected, decorating, onPointerDown }) {
  const f = FURNITURE_BY_ID[item.id];
  if (!f) return null;
  if (item.id === 'fairy') return <FairyLights />;
  const Model = MODELS[item.id];
  if (!Model) return null;
  const pos = toWorld(item);
  return (
    <group position={pos} onPointerDown={decorating ? (e) => onPointerDown?.(e, item) : undefined}>
      <Model />
      {decorating && (
        <mesh position={[0, 0.01, f.layer === 'wall' ? 0.05 : 0]} rotation={f.layer === 'wall' ? [0, 0, 0] : [-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45, 0.52, 32]} />
          <meshBasicMaterial color={selected ? '#E8B4A0' : '#F5EBDD'} transparent opacity={selected ? 0.9 : 0.35} />
        </mesh>
      )}
    </group>
  );
}
