import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Box, mat } from '../kit';

function Screen() {
  const ref = useRef();
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#2d3f63');
    grad.addColorStop(1, '#8fb3d9');
    g.fillStyle = grad;
    g.fillRect(0, 0, 1024, 512);
    g.fillStyle = 'rgba(245,235,221,0.75)';
    g.font = 'italic 72px Fraunces, Georgia, serif';
    g.textAlign = 'center';
    g.fillText('now showing: us', 512, 280);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.intensity = 3 + Math.sin(clock.elapsedTime * 3) * 0.4 + Math.sin(clock.elapsedTime * 7.7) * 0.2;
  });
  return (
    <group position={[0, 3.1, -3.6]}>
      <mesh>
        <planeGeometry args={[7.5, 3.6]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <pointLight ref={ref} position={[0, -0.5, 2.5]} color="#9fc0ea" intensity={3} distance={12} decay={1.4} />
    </group>
  );
}

/** A tiny movie theater with exactly two good seats. */
export default function Theater() {
  return (
    <group>
      <color attach="background" args={['#120d12']} />
      <fog attach="fog" args={['#120d12', 10, 30]} />
      <hemisphereLight args={['#6a7fa8', '#1a0e12', 0.7]} />
      <pointLight position={[0, 3, 1]} intensity={3} distance={10} color="#9fc0ea" />
      <Screen />
      <Box size={[16, 0.2, 14]} color="#2a1a20" position={[0, -0.1, 2]} />
      <Box size={[16, 6, 0.2]} color="#1a1216" position={[0, 3, -3.8]} />
      {/* curtains */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 4.6, 3, -3.5]}>
          {[-0.6, -0.3, 0, 0.3, 0.6].map((dx) => (
            <mesh key={dx} position={[dx * side, 0, 0]} scale={[0.22, 1, 0.16]} material={mat('#6E2A36')}>
              <cylinderGeometry args={[1, 1.2, 6, 16]} />
            </mesh>
          ))}
        </group>
      ))}
      <Box size={[16, 0.7, 0.4]} color="#7A2E3F" position={[0, 5.6, -3.4]} />
      {/* seats: rows behind us */}
      {[-2.6, -1.5].map((z, row) =>
        Array.from({ length: 9 }, (_, i) => (
          <group key={`${row}-${i}`} position={[-6 + i * 1.5, 0, z]}>
            <Box size={[1.2, 0.5, 0.9]} color="#5A1E2A" position={[0, 0.45, 0]} />
            <Box size={[1.2, 1.0, 0.25]} color="#6E2A36" position={[0, 0.9, -0.4]} />
          </group>
        )),
      )}
      <Box size={[1.2, 0.5, 0.9]} color="#5A1E2A" position={[-3.9, 0.45, 0.8]} />
      <Box size={[1.2, 0.5, 0.9]} color="#5A1E2A" position={[3.9, 0.45, 0.8]} />
    </group>
  );
}
