import { Box, Sky, Skyline, Rain, Flicker, Motes, mat, glowMat } from '../kit';

function Pendant({ x }) {
  return (
    <group position={[x, 4.2, -0.8]}>
      <mesh position={[0, 0.6, 0]} material={mat('#1a1314')}>
        <cylinderGeometry args={[0.01, 0.01, 1.2, 6]} />
      </mesh>
      <mesh material={mat('#B8664A')}>
        <coneGeometry args={[0.4, 0.35, 24, 1, true]} />
      </mesh>
      <mesh position={[0, -0.12, 0]} material={glowMat('#FFE2A8')}>
        <sphereGeometry args={[0.12, 16, 12]} />
      </mesh>
      <Flicker position={[0, -0.4, 0]} intensity={3.5} distance={7} color="#ffc27a" speed={0.3} />
    </group>
  );
}

function Cup({ position, color = '#F5EBDD' }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]} material={mat(color)}>
        <cylinderGeometry args={[0.12, 0.1, 0.24, 20]} />
      </mesh>
      <mesh position={[0.14, 0.13, 0]} rotation={[0, 0, Math.PI / 2]} material={mat(color)}>
        <torusGeometry args={[0.06, 0.018, 8, 16]} />
      </mesh>
      <mesh position={[0, 0.235, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#6b432e')}>
        <circleGeometry args={[0.1, 20]} />
      </mesh>
    </group>
  );
}

/** Rainy café: warm inside, city rain outside. */
export default function Cafe() {
  const wall = '#4a3230';
  return (
    <group>
      <fog attach="fog" args={['#2a1f22', 16, 40]} />
      <hemisphereLight args={['#f2c9a0', '#2a1a18', 0.8]} />
      <directionalLight position={[2, 5, 6]} intensity={0.6} color="#ffe2c4" />
      <Sky top="#141833" mid="#262a45" bottom="#3a3348" />
      <Skyline z={-14} baseY={-2} maxH={12} seed={44} color="#23263D" windowColor="#E8B4A0" />
      <Rain count={900} area={[14, 7, 3]} center={[0, 3, -5]} />
      {/* floor, walls, big window */}
      <Box size={[14, 0.2, 12]} color="#4a2e22" position={[0, -0.1, 2]} />
      <Box size={[14, 1.2, 0.25]} color={wall} position={[0, 0.6, -3.1]} />
      <Box size={[14, 0.9, 0.25]} color={wall} position={[0, 5.05, -3.1]} />
      {[-6.5, -2.2, 2.2, 6.5].map((x) => (
        <Box key={x} size={[0.2, 3.5, 0.3]} color="#1A1314" position={[x, 2.95, -3.1]} />
      ))}
      <mesh position={[0, 2.95, -3.12]} material={glowMat('#E8B4A0', 0.06)}>
        <planeGeometry args={[14, 3.5]} />
      </mesh>
      <Box size={[0.2, 5.5, 12]} color="#3a2826" position={[-7, 2.75, 2]} />
      <Box size={[0.2, 5.5, 12]} color="#3a2826" position={[7, 2.75, 2]} />
      {/* counter */}
      <Box size={[3.5, 1.1, 0.8]} color="#5A3B2C" position={[-5, 0.55, -1.5]} />
      <Box size={[3.6, 0.08, 0.9]} color="#6B432E" position={[-5, 1.12, -1.5]} />
      {/* our table */}
      <group position={[0, 0, -1.2]}>
        <mesh position={[0, 1.1, 0]} material={mat('#6B432E')}>
          <cylinderGeometry args={[0.8, 0.8, 0.07, 32]} />
        </mesh>
        <mesh position={[0, 0.55, 0]} material={mat('#4A2E22')}>
          <cylinderGeometry args={[0.07, 0.1, 1.1, 12]} />
        </mesh>
        <Cup position={[-0.3, 1.14, 0.1]} />
        <Cup position={[0.3, 1.14, 0.05]} color="#E8B4A0" />
        <mesh position={[0, 1.2, -0.3]} material={glowMat('#FFE2A8')}>
          <cylinderGeometry args={[0.05, 0.05, 0.14, 12]} />
        </mesh>
        <Flicker position={[0, 1.5, -0.3]} intensity={1.2} distance={3} color="#ffb46b" />
      </group>
      {[-3, 0, 3].map((x) => (
        <Pendant key={x} x={x} />
      ))}
      <Motes count={25} area={[10, 3, 5]} center={[0, 2.2, -0.5]} color="#F2C98B" size={0.04} rise={0.05} />
    </group>
  );
}
