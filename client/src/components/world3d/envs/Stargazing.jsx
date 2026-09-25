import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Stars, Motes, mat } from '../kit';

function ShootingStar() {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime % 9;
    if (!ref.current) return;
    const on = t < 1;
    ref.current.visible = on;
    if (on) ref.current.position.set(14 - t * 22, 18 - t * 7, -30);
  });
  return (
    <mesh ref={ref} rotation={[0, 0, 0.3]}>
      <boxGeometry args={[3, 0.05, 0.05]} />
      <meshBasicMaterial color="#fff6e8" transparent opacity={0.8} fog={false} />
    </mesh>
  );
}

/** A grassy hill, a blanket, and far too many stars. */
export default function Stargazing() {
  return (
    <group>
      <fog attach="fog" args={['#0b0e1e', 18, 60]} />
      <hemisphereLight args={['#6c78c8', '#0b0e1e', 0.9]} />
      <directionalLight position={[-4, 8, 4]} intensity={0.5} color="#b8c6ff" />
      <Sky top="#04051a" mid="#141a3a" bottom="#2a2a50" />
      <Stars count={1200} size={0.18} />
      <Stars count={120} size={0.4} seed={21} />
      <ShootingStar />
      {/* rolling hills */}
      <mesh position={[0, -18, -2]} material={mat('#1c2a33')}>
        <sphereGeometry args={[18, 64, 32]} />
      </mesh>
      <mesh position={[-22, -14, -26]} material={mat('#121a26')}>
        <sphereGeometry args={[20, 48, 24]} />
      </mesh>
      <mesh position={[24, -16, -30]} material={mat('#101722')}>
        <sphereGeometry args={[22, 48, 24]} />
      </mesh>
      {/* tree silhouettes */}
      {[[-6, -4], [-7.5, -6], [6.5, -5], [8, -7]].map(([x, z], i) => (
        <group key={i} position={[x, -0.6, z]}>
          <mesh position={[0, 1.6, 0]} material={mat('#0c1216')}>
            <coneGeometry args={[1.1, 3.2, 10]} />
          </mesh>
          <mesh position={[0, 2.8, 0]} material={mat('#0c1216')}>
            <coneGeometry args={[0.8, 2.2, 10]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.02, 0.4]} rotation={[-Math.PI / 2 + 0.02, 0, 0.1]} material={mat('#46557a')}>
        <planeGeometry args={[3.4, 2.2]} />
      </mesh>
      <Motes count={45} area={[14, 3, 8]} center={[0, 1.4, -1]} color="#C9F0B0" size={0.08} rise={0.08} seed={9} />
    </group>
  );
}
