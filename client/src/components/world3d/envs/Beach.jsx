import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sky, Motes, mat } from '../kit';

function Sea() {
  const ref = useRef();
  const geo = useMemo(() => new THREE.PlaneGeometry(120, 60, 80, 40), []);
  const base = useMemo(() => geo.attributes.position.array.slice(), [geo]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const a = geo.attributes.position.array;
    for (let i = 0; i < a.length; i += 3) {
      const x = base[i];
      const y = base[i + 1];
      a[i + 2] = Math.sin(x * 0.35 + t * 0.9) * 0.08 + Math.sin(y * 0.5 + t * 1.3) * 0.06;
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
  });
  return (
    <mesh ref={ref} geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, -34]}>
      <meshStandardMaterial color="#6d5f96" roughness={0.25} metalness={0.2} emissive="#3a2f5c" emissiveIntensity={0.3} />
    </mesh>
  );
}

function Palm({ position, lean = 0.2 }) {
  const segs = 7;
  return (
    <group position={position} rotation={[0, 0, lean]}>
      {Array.from({ length: segs }, (_, i) => (
        <mesh key={i} position={[Math.sin(i * 0.25) * 0.15, 0.35 + i * 0.6, 0]} material={mat(i % 2 ? '#6b4a3a' : '#7a5744')}>
          <cylinderGeometry args={[0.16 - i * 0.012, 0.18 - i * 0.012, 0.62, 12]} />
        </mesh>
      ))}
      <group position={[0.35, 4.4, 0]}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} rotation={[0, (i / 7) * Math.PI * 2, 0.9]} position={[0, 0, 0]} material={mat(i % 2 ? '#4f7a55' : '#5e8a60')}>
            <boxGeometry args={[0.35, 0.05, 2.4]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Sunset beach. */
export default function Beach() {
  return (
    <group>
      <fog attach="fog" args={['#e0a08a', 25, 90]} />
      <hemisphereLight args={['#ffd2b0', '#6a4a60', 1.2]} />
      <directionalLight position={[0, 2.5, -10]} intensity={1.4} color="#ffb28a" />
      <directionalLight position={[3, 5, 6]} intensity={0.7} color="#fff0e0" />
      <Sky top="#2b2750" mid="#b0688a" bottom="#f2b98b" />
      {/* the sun, half set */}
      <mesh position={[0, 2.2, -58]}>
        <sphereGeometry args={[5, 40, 30]} />
        <meshBasicMaterial color="#FFD9A8" fog={false} />
      </mesh>
      <mesh position={[0, 2.2, -58.5]}>
        <circleGeometry args={[11, 48]} />
        <meshBasicMaterial color="#FFC98B" transparent opacity={0.25} fog={false} />
      </mesh>
      <Sea />
      {/* sand */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]} material={mat('#D8A884')}>
        <circleGeometry args={[22, 64]} />
      </mesh>
      <Palm position={[-5.5, 0, -3]} lean={0.18} />
      <Palm position={[6, 0, -5]} lean={-0.25} />
      {/* towel + umbrella */}
      <mesh position={[0, 0.02, 0.4]} rotation={[-Math.PI / 2, 0, -0.08]} material={mat('#F5EBDD')}>
        <planeGeometry args={[3.2, 1.8]} />
      </mesh>
      {[-0.6, 0, 0.6].map((z) => (
        <mesh key={z} position={[0, 0.025, 0.4 + z]} rotation={[-Math.PI / 2, 0, -0.08]} material={mat('#D98E96')}>
          <planeGeometry args={[3.2, 0.18]} />
        </mesh>
      ))}
      <group position={[3.2, 0, -1.4]}>
        <mesh position={[0, 1.4, 0]} material={mat('#F5EBDD')}>
          <cylinderGeometry args={[0.04, 0.04, 2.8, 10]} />
        </mesh>
        <mesh position={[0, 2.8, 0]} material={mat('#E8B4A0')}>
          <coneGeometry args={[1.6, 0.6, 12, 1, true]} />
        </mesh>
      </group>
      <Motes count={20} area={[12, 3, 6]} center={[0, 2, -1]} color="#FFE2B0" size={0.05} rise={0.04} />
    </group>
  );
}
