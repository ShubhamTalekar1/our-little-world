import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { buildChibi } from './chibi/buildChibi';
import { applyPose } from './chibi/pose';
import { cameraFor, FOV, LIGHTS } from './chibi/stage';

function Chibi({ config, pose, expression, flip, motion }) {
  const key = JSON.stringify(config);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const built = useMemo(() => buildChibi(config), [key]);
  useEffect(() => () => built.dispose(), [built]);
  const offset = useRef(Math.random() * 10);
  useLayoutEffect(() => applyPose(built.parts, { pose, expression, snap: true, motion: false }), [built]); // eslint-disable-line react-hooks/exhaustive-deps
  useFrame((state, dt) => {
    applyPose(built.parts, { pose, expression, t: state.clock.elapsedTime + offset.current, dt: Math.min(dt, 0.1), motion });
  });
  return (
    <group scale={[flip ? -1 : 1, 1, 1]} rotation={[0, flip ? -0.32 : 0.32, 0]}>
      <primitive object={built.root} />
    </group>
  );
}

function Rig({ crop }) {
  const { camera } = useThree();
  useLayoutEffect(() => {
    const c = cameraFor(crop);
    camera.position.set(...c.position);
    camera.lookAt(...c.target);
    camera.updateProjectionMatrix();
  }, [camera, crop]);
  return null;
}

/** A live, animated chibi in its own small transparent canvas. */
export default function Avatar3D({ config, pose = 'idle', expression = null, flip = false, crop = 'full', motion = true, width, height, label }) {
  const cam = cameraFor(crop);
  return (
    <div style={{ width, height }} role="img" aria-label={label}>
      <Canvas
        dpr={[1, 2]}
        flat
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        camera={{ fov: FOV, position: cam.position, near: 0.1, far: 50 }}
        style={{ width, height, pointerEvents: 'none' }}
        aria-hidden
      >
        <Rig crop={crop} />
        {LIGHTS.map((l, i) =>
          l.type === 'hemi' ? <hemisphereLight key={i} args={[l.sky, l.ground, l.intensity]} /> : <directionalLight key={i} position={l.position} intensity={l.intensity} color={l.color} />,
        )}
        <Chibi config={config} pose={pose} expression={expression} flip={flip} motion={motion} />
      </Canvas>
    </div>
  );
}
