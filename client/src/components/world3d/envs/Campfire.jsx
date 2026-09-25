import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Stars, Motes, Flicker, mat, glowMat } from '../kit';

function Fire({ position }) {
  const flames = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    flames.current?.children.forEach((f, i) => {
      f.scale.y = 1 + Math.sin(t * (6 + i) + i) * 0.15;
      f.scale.x = 1 + Math.sin(t * (5 + i) + i * 2) * 0.08;
    });
  });
  return (
    <group position={position}>
      {[0.5, -0.5].map((r) => (
        <mesh key={r} position={[0, 0.1, 0]} rotation={[0, r, Math.PI / 2]} material={mat('#5A3B2C')}>
          <cylinderGeometry args={[0.1, 0.1, 1.1, 12]} />
        </mesh>
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[Math.cos(i) * 0.55, 0.08, Math.sin(i) * 0.55]} material={mat('#5d5a66')}>
          <sphereGeometry args={[0.13, 10, 8]} />
        </mesh>
      ))}
      <group ref={flames} position={[0, 0.15, 0]}>
        <mesh position={[0, 0.35, 0]} material={glowMat('#E8804A', 0.95)}>
          <coneGeometry args={[0.3, 0.8, 16]} />
        </mesh>
        <mesh position={[0.08, 0.3, 0.05]} material={glowMat('#F2A860', 0.95)}>
          <coneGeometry args={[0.2, 0.6, 16]} />
        </mesh>
        <mesh position={[-0.05, 0.25, -0.02]} material={glowMat('#FFE2A8', 0.95)}>
          <coneGeometry args={[0.12, 0.4, 16]} />
        </mesh>
      </group>
      <Flicker position={[0, 0.8, 0]} intensity={9} distance={12} color="#ff9a55" />
      <Motes count={30} area={[0.8, 3, 0.8]} center={[0, 1.6, 0]} color="#FFB070" size={0.05} rise={0.6} seed={11} />
    </group>
  );
}

/** A campfire in the pines. */
export default function Campfire() {
  return (
    <group>
      <fog attach="fog" args={['#0d0b14', 10, 32]} />
      <hemisphereLight args={['#4a4a78', '#140f14', 0.6]} />
      <Sky top="#05060f" mid="#141226" bottom="#1e1a2e" />
      <Stars count={500} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={mat('#2a2230')}>
        <circleGeometry args={[30, 48]} />
      </mesh>
      {Array.from({ length: 22 }, (_, i) => {
        const a = (i / 22) * Math.PI - Math.PI;
        const r = 9 + (i % 3) * 2.5;
        const h = 3.5 + ((i * 7) % 5) * 0.6;
        return (
          <group key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r * 0.9 - 1]}>
            <mesh position={[0, h / 2, 0]} material={mat(i % 2 ? '#122018' : '#16261c')}>
              <coneGeometry args={[1.1, h, 10]} />
            </mesh>
            <mesh position={[0, h * 0.8, 0]} material={mat('#16261c')}>
              <coneGeometry args={[0.8, h * 0.6, 10]} />
            </mesh>
          </group>
        );
      })}
      <Fire position={[0, 0, -1.3]} />
      {[-2.2, 2.2].map((x) => (
        <mesh key={x} position={[x, 0.22, -0.9]} rotation={[0, x > 0 ? 0.4 : -0.4, Math.PI / 2]} material={mat('#4a3026')}>
          <cylinderGeometry args={[0.22, 0.22, 1.8, 14]} />
        </mesh>
      ))}
      <Motes count={30} area={[14, 3, 8]} center={[0, 1.5, -2]} color="#C9F0B0" size={0.06} rise={0.05} seed={3} />
    </group>
  );
}
