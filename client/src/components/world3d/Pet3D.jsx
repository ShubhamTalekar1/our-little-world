import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { mat, glowMat } from './kit';

const LOOKS = {
  cat: { body: '#E9D9C4', accent: '#C9A988', ear: 'pointy' },
  dog: { body: '#C89A6A', accent: '#8E6440', ear: 'floppy' },
  bunny: { body: '#F2ECEA', accent: '#E8B4A0', ear: 'long' },
  fox: { body: '#D97A48', accent: '#F5EBDD', ear: 'pointy' },
  dragon: { body: '#9DB8A0', accent: '#B8A7D9', ear: 'horns' },
};

/** The shared companion, sitting on the rug. Tap to make it hop. */
export default function Pet3D({ pet, position = [-2.1, 0, 0.1], onClick }) {
  const g = useRef();
  const hop = useRef(0);
  const L = LOOKS[pet.species] ?? LOOKS.cat;
  useFrame(({ clock }, dt) => {
    if (!g.current) return;
    hop.current = Math.max(0, hop.current - dt);
    const t = clock.elapsedTime;
    g.current.position.y = hop.current > 0 ? Math.abs(Math.sin(hop.current * 9)) * 0.35 : Math.sin(t * 2) * 0.01;
    g.current.rotation.y = 0.5 + Math.sin(t * 0.6) * 0.15;
    const tail = g.current.getObjectByName('tail');
    if (tail) tail.rotation.z = Math.sin(t * 3) * 0.4;
  });
  const sleepy = pet.hunger < 25;
  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        hop.current = 0.7;
        onClick?.();
      }}
    >
      <group ref={g} scale={0.9}>
        <mesh position={[0, 0.3, 0]} scale={[1, 0.85, 1.2]} material={mat(L.body)}>
          <sphereGeometry args={[0.3, 24, 18]} />
        </mesh>
        <mesh position={[0, 0.3, 0.12]} scale={[0.7, 0.6, 0.8]} material={mat(L.accent)}>
          <sphereGeometry args={[0.28, 20, 16]} />
        </mesh>
        <group position={[0, 0.72, 0.18]}>
          <mesh material={mat(L.body)}>
            <sphereGeometry args={[0.27, 24, 18]} />
          </mesh>
          {L.ear === 'pointy' &&
            [-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.15, 0.24, 0]} rotation={[0, 0, -s * 0.3]} material={mat(L.body)}>
                <coneGeometry args={[0.09, 0.2, 12]} />
              </mesh>
            ))}
          {L.ear === 'floppy' &&
            [-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.25, 0.02, 0]} rotation={[0, 0, s * 0.3]} scale={[0.6, 1.3, 0.5]} material={mat(L.accent)}>
                <sphereGeometry args={[0.1, 14, 10]} />
              </mesh>
            ))}
          {L.ear === 'long' &&
            [-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.1, 0.35, 0]} rotation={[0, 0, -s * 0.15]} material={mat(L.body)}>
                <capsuleGeometry args={[0.055, 0.28, 6, 12]} />
              </mesh>
            ))}
          {L.ear === 'horns' &&
            [-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.12, 0.25, -0.02]} rotation={[-0.3, 0, -s * 0.3]} material={mat(L.accent)}>
                <coneGeometry args={[0.05, 0.18, 10]} />
              </mesh>
            ))}
          {[-1, 1].map((s) => (
            <mesh key={`e${s}`} position={[s * 0.1, 0.03, 0.24]} scale={[1, sleepy ? 0.25 : 1.2, 0.6]} material={glowMat('#2A1E1C')}>
              <sphereGeometry args={[0.04, 12, 10]} />
            </mesh>
          ))}
          {!sleepy &&
            [-1, 1].map((s) => (
              <mesh key={`h${s}`} position={[s * 0.1 + 0.012, 0.05, 0.27]} material={glowMat('#ffffff')}>
                <sphereGeometry args={[0.013, 8, 6]} />
              </mesh>
            ))}
          <mesh position={[0, -0.05, 0.26]} material={mat('#C4707A')}>
            <sphereGeometry args={[0.022, 8, 6]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={`b${s}`} position={[s * 0.17, -0.06, 0.2]} rotation={[0, s * 0.6, 0]} material={glowMat('#F08A95', 0.4)}>
              <circleGeometry args={[0.045, 14]} />
            </mesh>
          ))}
          {pet.accessory === 'bow' && (
            <group position={[0.13, 0.2, 0.08]}>
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * 0.05, 0, 0]} rotation={[0, 0, s * Math.PI / 2]} material={mat('#D98E96')}>
                  <coneGeometry args={[0.04, 0.08, 8]} />
                </mesh>
              ))}
            </group>
          )}
          {pet.accessory === 'crown' && (
            <mesh position={[0, 0.27, 0]} material={mat('#F2C98B')}>
              <cylinderGeometry args={[0.1, 0.12, 0.08, 6, 1, true]} />
            </mesh>
          )}
          {pet.accessory === 'flower' && (
            <mesh position={[-0.14, 0.2, 0.1]} material={mat('#F5EBDD')}>
              <sphereGeometry args={[0.05, 10, 8]} />
            </mesh>
          )}
        </group>
        {pet.accessory === 'scarf' && (
          <mesh position={[0, 0.5, 0.12]} rotation={[Math.PI / 2 - 0.3, 0, 0]} material={mat('#B8664A')}>
            <torusGeometry args={[0.2, 0.05, 10, 24]} />
          </mesh>
        )}
        <mesh name="tail" position={[0, 0.3, -0.35]} rotation={[0.8, 0, 0]} material={mat(L.body)}>
          <capsuleGeometry args={[0.05, 0.3, 6, 10]} />
        </mesh>
      </group>
    </group>
  );
}
