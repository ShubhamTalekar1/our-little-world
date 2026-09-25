import { Box, Sky, Stars, Skyline, StringLights, Motes, mat } from '../kit';

function Planter({ position }) {
  return (
    <group position={position}>
      <Box size={[1.1, 0.8, 0.8]} color="#4A3833" position={[0, 0.4, 0]} />
      {[[-0.25, 1.05, 0, 0.45], [0.2, 1.2, -0.05, 0.55], [0.35, 0.95, 0.15, 0.35], [-0.1, 1.35, 0.1, 0.35]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} material={mat(i % 2 ? '#6E8C70' : '#5E7A60')}>
          <sphereGeometry args={[r, 20, 16]} />
        </mesh>
      ))}
    </group>
  );
}

/** Rooftop under the stars. */
export default function Rooftop() {
  return (
    <group>
      <fog attach="fog" args={['#241f38', 16, 45]} />
      <hemisphereLight args={['#9d8fd0', '#2a2230', 1.0]} />
      <directionalLight position={[-3, 6, 4]} intensity={0.6} color="#c9d6ff" />
      <pointLight position={[0, 3.2, -1]} intensity={4} distance={10} decay={1.5} color="#ffcf8a" />
      <Sky top="#070918" mid="#1b1b3a" bottom="#5a3a55" />
      <Stars count={500} />
      <mesh position={[9, 11, -32]}>
        <sphereGeometry args={[1.8, 32, 24]} />
        <meshBasicMaterial color="#F5EBDD" fog={false} />
      </mesh>
      <Skyline z={-14} baseY={-8} maxH={12} seed={31} color="#121326" />
      <Skyline z={-24} baseY={-8} maxH={16} seed={12} color="#0d0e1d" windowColor="#E8B4A0" />
      {/* roof */}
      <Box size={[16, 0.2, 12]} color="#2E2A36" position={[0, -0.1, 2]} />
      {Array.from({ length: 7 }, (_, i) => (
        <Box key={i} size={[0.02, 0.005, 12]} color="#221F29" position={[-6 + i * 2, 0.002, 2]} />
      ))}
      <Box size={[16, 1, 0.35]} color="#3E3848" position={[0, 0.5, -3.2]} />
      <Box size={[16, 0.1, 0.5]} color="#4b4458" position={[0, 1.02, -3.2]} />
      {/* lights on poles */}
      {[-4.5, 4.5].map((x) => (
        <mesh key={x} position={[x, 1.6, -2.9]} material={mat('#2b2b3a')}>
          <cylinderGeometry args={[0.04, 0.05, 3.2, 10]} />
        </mesh>
      ))}
      <StringLights from={[-4.5, 3.1, -2.9]} to={[4.5, 3.1, -2.9]} sag={0.7} count={22} />
      <StringLights from={[-4.5, 3.1, -2.9]} to={[-2, 3.3, 3]} sag={0.5} count={12} />
      <StringLights from={[4.5, 3.1, -2.9]} to={[2, 3.3, 3]} sag={0.5} count={12} />
      <Planter position={[-4.3, 0, -2.2]} />
      <Planter position={[4.3, 0, -2.2]} />
      {/* picnic blanket + cushions */}
      <mesh position={[0, 0.015, 0.4]} rotation={[-Math.PI / 2, 0, 0.05]} material={mat('#B8A7D9')}>
        <planeGeometry args={[3.6, 2.4]} />
      </mesh>
      {[-1.4, 1.4].map((x, i) => (
        <mesh key={x} position={[x, 0.15, -0.5]} scale={[0.45, 0.15, 0.35]} material={mat(i ? '#E8B4A0' : '#F5EBDD')}>
          <sphereGeometry args={[1, 20, 14]} />
        </mesh>
      ))}
      <Motes count={25} area={[12, 4, 6]} center={[0, 2.5, -1]} color="#FFE2A8" size={0.05} rise={0.05} />
    </group>
  );
}
