import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sky, Stars, Rain, Skyline, Motes, mat, glowMat } from '../kit';

function WallClock({ position }) {
  const h = useRef();
  const m = useRef();
  const s = useRef();
  useFrame(() => {
    const d = new Date();
    const sec = d.getSeconds();
    const min = d.getMinutes() + sec / 60;
    const hr = (d.getHours() % 12) + min / 60;
    if (h.current) h.current.rotation.z = -(hr / 12) * Math.PI * 2;
    if (m.current) m.current.rotation.z = -(min / 60) * Math.PI * 2;
    if (s.current) s.current.rotation.z = -(sec / 60) * Math.PI * 2;
  });
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={mat('#6B4A3A')}>
        <cylinderGeometry args={[0.42, 0.42, 0.08, 40]} />
      </mesh>
      <mesh position={[0, 0, 0.045]} material={mat('#F5EBDD')}>
        <circleGeometry args={[0.36, 40]} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[Math.sin((i / 12) * Math.PI * 2) * 0.3, Math.cos((i / 12) * Math.PI * 2) * 0.3, 0.05]} material={mat('#6B4A3A')}>
          <circleGeometry args={[i % 3 === 0 ? 0.025 : 0.014, 10]} />
        </mesh>
      ))}
      <group ref={h} position={[0, 0, 0.055]}>
        <mesh position={[0, 0.09, 0]} material={mat('#3B3128')}>
          <boxGeometry args={[0.035, 0.18, 0.01]} />
        </mesh>
      </group>
      <group ref={m} position={[0, 0, 0.06]}>
        <mesh position={[0, 0.13, 0]} material={mat('#3B3128')}>
          <boxGeometry args={[0.025, 0.26, 0.01]} />
        </mesh>
      </group>
      <group ref={s} position={[0, 0, 0.065]}>
        <mesh position={[0, 0.12, 0]} material={mat('#D4937C')}>
          <boxGeometry args={[0.01, 0.26, 0.01]} />
        </mesh>
      </group>
    </group>
  );
}

function Bookshelf({ position }) {
  const books = useMemo(() => {
    const colors = ['#B8664A', '#9DB8A0', '#E8B4A0', '#5A4B72', '#EFD58F', '#8FB3D9', '#D98E96', '#F5EBDD'];
    const out = [];
    [0.55, 1.35, 2.15].forEach((y, row) => {
      let x = -0.62;
      let i = row * 3;
      while (x < 0.5) {
        const w = 0.09 + ((i * 7) % 5) * 0.015;
        const h = 0.45 + ((i * 11) % 4) * 0.06;
        out.push({ x: x + w / 2, y: y + h / 2, w, h, c: colors[i % colors.length], tilt: i % 9 === 4 ? 0.25 : 0 });
        x += w + 0.015;
        i += 1;
        if (i % 5 === 0) x += 0.18;
      }
    });
    return out;
  }, []);
  return (
    <group position={position}>
      <Box size={[1.5, 3, 0.55]} color="#3B2C2A" position={[0, 1.5, 0]} />
      {[0.5, 1.3, 2.1, 2.9].map((y) => (
        <Box key={y} size={[1.42, 0.06, 0.5]} color="#2B201F" position={[0, y, 0.04]} />
      ))}
      {books.map((b, i) => (
        <Box key={i} size={[b.w, b.h, 0.36]} color={b.c} position={[b.x, b.y, 0.08]} rotation={[0, 0, b.tilt]} />
      ))}
    </group>
  );
}

function Couch({ position }) {
  return (
    <group position={position}>
      <Box size={[3.4, 0.5, 1.1]} color="#7A5754" position={[0, 0.35, 0]} />
      <Box size={[3.4, 1.0, 0.35]} color="#8B6560" position={[0, 0.95, -0.42]} />
      {[-1.8, 1.8].map((x) => (
        <Box key={x} size={[0.35, 0.8, 1.1]} color="#7A5754" position={[x, 0.55, 0]} />
      ))}
      {[-0.8, 0.8].map((x) => (
        <mesh key={x} position={[x, 0.68, 0.05]} scale={[0.75, 0.22, 0.45]} material={mat('#8B6560')}>
          <sphereGeometry args={[1, 24, 16]} />
        </mesh>
      ))}
      <mesh position={[-1.1, 1.0, -0.15]} rotation={[0.2, 0.3, -0.2]} scale={[0.35, 0.3, 0.12]} material={mat('#E8B4A0')}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
      <mesh position={[1.15, 1.0, -0.15]} rotation={[0.2, -0.3, 0.2]} scale={[0.35, 0.3, 0.12]} material={mat('#B8A7D9')}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
    </group>
  );
}

/** "Rainy window room": the default cozy bedroom at night. */
export default function Bedroom() {
  const wall = '#2F2A3F';
  // back wall with a window opening (x −1.7…1.7, y 1.5…4.2)
  return (
    <group>
      <color attach="background" args={['#15141f']} />
      <fog attach="fog" args={['#1a1826', 14, 34]} />
      <hemisphereLight args={['#b3a6d6', '#3a2a28', 1.0]} />
      <directionalLight position={[2, 5, 6]} intensity={0.9} color="#ffe2c4" />
      <directionalLight position={[0, 4, -8]} intensity={0.6} color="#8fa6d9" />
      <pointLight position={[3.4, 2.4, -0.6]} intensity={5} distance={9} decay={1.6} color="#ffbf7a" />

      {/* outside, seen through the window */}
      <Sky top="#0a0d22" mid="#232448" bottom="#3a2e52" />
      <Stars count={220} />
      <mesh position={[2.5, 7.5, -30]}>
        <sphereGeometry args={[1.6, 32, 24]} />
        <meshBasicMaterial color="#F5EBDD" fog={false} />
      </mesh>
      <Skyline z={-16} baseY={-4} maxH={10} seed={8} />
      <Rain count={500} area={[6, 6, 1.2]} center={[0, 3, -4.1]} />

      {/* room shell */}
      <Box size={[14, 0.2, 12]} color="#3E2C2B" position={[0, -0.1, 2]} />
      {Array.from({ length: 9 }, (_, i) => (
        <Box key={i} size={[14, 0.005, 0.02]} color="#2A1D1C" position={[0, 0.002, -2.6 + i * 1.2]} />
      ))}
      <Box size={[5.3, 5.4, 0.2]} color={wall} position={[-4.35, 2.7, -3.1]} />
      <Box size={[5.3, 5.4, 0.2]} color={wall} position={[4.35, 2.7, -3.1]} />
      <Box size={[3.4, 1.5, 0.2]} color={wall} position={[0, 0.75, -3.1]} />
      <Box size={[3.4, 1.2, 0.2]} color={wall} position={[0, 4.8, -3.1]} />
      <Box size={[0.2, 5.4, 12]} color="#2A2638" position={[-7, 2.7, 2]} />
      <Box size={[0.2, 5.4, 12]} color="#2A2638" position={[7, 2.7, 2]} />
      {/* skirting */}
      <Box size={[14, 0.18, 0.06]} color="#241A1A" position={[0, 0.09, -2.99]} />

      {/* window frame + glass + sill */}
      <group position={[0, 2.85, -3.05]}>
        {[
          [[3.6, 0.14, 0.18], [0, 1.36, 0]],
          [[3.6, 0.14, 0.18], [0, -1.36, 0]],
          [[0.14, 2.86, 0.18], [-1.73, 0, 0]],
          [[0.14, 2.86, 0.18], [1.73, 0, 0]],
          [[0.08, 2.7, 0.14], [0, 0, 0]],
          [[3.4, 0.08, 0.14], [0, 0.1, 0]],
        ].map(([size, pos], i) => (
          <Box key={i} size={size} color="#4A3833" position={pos} />
        ))}
        <mesh position={[0, 0, -0.02]} material={glowMat('#8fa6d9', 0.08)}>
          <planeGeometry args={[3.4, 2.7]} />
        </mesh>
        <Box size={[3.9, 0.12, 0.45]} color="#5A4540" position={[0, -1.45, 0.18]} />
      </group>

      {/* curtains */}
      {[-2.25, 2.25].map((x) => (
        <group key={x} position={[x, 2.8, -2.85]}>
          {[-0.25, 0, 0.25].map((dx) => (
            <mesh key={dx} position={[dx, 0, 0]} scale={[0.16, 1, 0.12]} material={mat('#5A4B72')}>
              <cylinderGeometry args={[1, 1.25, 3.4, 16]} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 4.55, -2.85]} rotation={[0, 0, Math.PI / 2]} material={mat('#6B4A3A')}>
        <cylinderGeometry args={[0.04, 0.04, 5.6, 12]} />
      </mesh>

      <Bookshelf position={[-4.6, 0, -2.6]} />
      <Couch position={[0, 0, -1.9]} />
      <WallClock position={[4.3, 3.4, -2.98]} />

      {/* rug */}
      <mesh position={[0, 0.012, 0.5]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.5, 1, 1]} material={mat('#4A3F5E')}>
        <circleGeometry args={[2.1, 48]} />
      </mesh>
      <mesh position={[0, 0.016, 0.5]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.5, 1, 1]} material={mat('#5E5178')}>
        <ringGeometry args={[1.8, 1.9, 48]} />
      </mesh>

      <Motes count={40} area={[10, 3.5, 5]} center={[0, 2, 0]} color="#F2C98B" size={0.05} rise={0.06} />
    </group>
  );
}
