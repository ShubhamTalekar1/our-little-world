import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ENVS_3D } from './envs';
import Furniture3D, { toWorld, toPercent, WALL_Z } from './Furniture3D';
import Pet3D from './Pet3D';
import { buildChibi } from '../avatar/chibi/buildChibi';
import { applyPose } from '../avatar/chibi/pose';
import { FURNITURE_BY_ID } from '../../catalog/furniture';

const FOV = 38;
const FOCUS = new THREE.Vector3(0, 1.15, 0.2);

/** Frames the couple for any container shape, with a slow breathing drift. */
function CameraRig({ mode, motion }) {
  const { camera, size, pointer } = useThree();
  const base = useRef(new THREE.Vector3());
  useLayoutEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const tan = Math.tan((FOV / 2) * (Math.PI / 180));
    const tight = mode === 'dance' ? 0.82 : mode === 'mini' ? 0.9 : 1;
    const dist = Math.max(2.15 / tan, 3.4 / (tan * aspect)) * tight;
    base.current.set(0, 1.7 + dist * 0.08, dist);
    camera.fov = FOV;
    camera.position.copy(base.current);
    camera.lookAt(FOCUS);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height, mode]);
  useFrame(({ clock }) => {
    if (!motion) return;
    const t = clock.elapsedTime;
    camera.position.x += (base.current.x + Math.sin(t * 0.15) * 0.25 + pointer.x * 0.35 - camera.position.x) * 0.03;
    camera.position.y += (base.current.y + Math.sin(t * 0.11) * 0.08 + pointer.y * 0.15 - camera.position.y) * 0.03;
    camera.lookAt(FOCUS);
  });
  return null;
}

function Chibi({ config, pose, expression, x, flip, motion, visible = true }) {
  const key = JSON.stringify(config);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const built = useMemo(() => buildChibi(config), [key]);
  useEffect(() => () => built.dispose(), [built]);
  const group = useRef();
  const offset = useRef(Math.random() * 10);
  useLayoutEffect(() => {
    if (group.current) group.current.position.x = x;
    applyPose(built.parts, { pose, expression, snap: true, motion: false });
  }, [built]); // eslint-disable-line react-hooks/exhaustive-deps
  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    g.position.x += (x - g.position.x) * Math.min(1, dt * 2.2);
    applyPose(built.parts, { pose, expression, t: state.clock.elapsedTime + offset.current, dt: Math.min(dt, 0.1), motion });
  });
  return (
    <group ref={group} position={[x, 0, 0.2]} visible={visible}>
      <group scale={[flip ? -1 : 1, 1, 1]} rotation={[0, flip ? -0.35 : 0.35, 0]}>
        <primitive object={built.root} />
      </group>
    </group>
  );
}

/** Projects the heads to screen space so HTML overlays can follow them. */
function Anchors({ myX, partnerX, anchors, bubbleRef, labelRef }) {
  const { camera, size } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  const project = (x, y) => {
    v.set(x, y, 0.2).project(camera);
    return [((v.x + 1) / 2) * 100, ((1 - v.y) / 2) * 100];
  };
  useFrame(() => {
    const me = project(myX.current, 2.1);
    const partner = project(partnerX.current, 2.1);
    anchors.current = { me, partner, meChest: project(myX.current, 1.3), partnerChest: project(partnerX.current, 1.3) };
    for (const [ref, [px, py]] of [
      [bubbleRef, project(partnerX.current + 0.45, 2.15)],
      [labelRef, project(partnerX.current, 2.45)],
    ]) {
      if (ref?.current) {
        ref.current.style.left = `${px}%`;
        ref.current.style.top = `${py}%`;
      }
    }
  });
  void size;
  return null;
}

/** Drag-to-arrange for decorations (floor items slide on the floor, wall items on the wall). */
function DragController({ dragging, setDragPos, onDrop }) {
  const { camera, pointer, raycaster } = useThree();
  const floor = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const wall = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -WALL_Z), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const last = useRef(null);
  useFrame(() => {
    if (!dragging) return;
    raycaster.setFromCamera(pointer, camera);
    const isWall = FURNITURE_BY_ID[dragging.id]?.layer === 'wall';
    if (raycaster.ray.intersectPlane(isWall ? wall : floor, hit)) {
      const p = isWall ? [THREE.MathUtils.clamp(hit.x, -5.5, 5.5), THREE.MathUtils.clamp(hit.y, 1.4, 4.4), WALL_Z] : [THREE.MathUtils.clamp(hit.x, -5.8, 5.8), 0, THREE.MathUtils.clamp(hit.z, -2.4, 1.2)];
      if (!last.current || Math.abs(last.current[0] - p[0]) + Math.abs(last.current[1] - p[1]) + Math.abs(last.current[2] - p[2]) > 0.01) {
        last.current = p;
        setDragPos(p);
      }
    }
  });
  useEffect(() => {
    if (!dragging) return undefined;
    const up = () => {
      onDrop(dragging, last.current); // null when it was just a tap (select only)
      last.current = null;
    };
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, [dragging, onDrop]);
  return null;
}

/**
 * The shared world in real 3D: environment, both chibis, decorations, pet.
 * Props mirror the old 2D room so pages don't need to change.
 */
export default function World3D({
  environment = 'bedroom',
  mode = 'home',
  me,
  partner,
  furniture = [],
  pet,
  decorating = false,
  selected,
  onSelect,
  onMove,
  onPetClick,
  anchors,
  bubbleRef,
  labelRef,
  motion = true,
}) {
  const Env = ENVS_3D[environment] ?? ENVS_3D.bedroom;
  const myX = useRef(me.x);
  const partnerX = useRef(partner.x);
  myX.current = me.x;
  partnerX.current = partner.x;
  const [dragging, setDragging] = useState(null);
  const [dragPos, setDragPos] = useState(null);

  return (
    <Canvas
      dpr={[1, 1.75]}
      flat
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: FOV, near: 0.1, far: 200, position: [0, 2, 8] }}
      onPointerMissed={() => onSelect?.(null)}
      style={{ touchAction: decorating ? 'none' : 'auto' }}
      aria-hidden
    >
      <CameraRig mode={mode} motion={motion} />
      <Suspense fallback={null}>
        <Env />
      </Suspense>
      {furniture.map((item) => {
        const live = dragging?.uid === item.uid && dragPos ? { ...item, ...Object.fromEntries(['x', 'y'].map((k, i) => [k, toPercent(item.id, dragPos)[i]])) } : item;
        return (
          <Furniture3D
            key={item.uid}
            item={live}
            decorating={decorating}
            selected={selected === item.uid}
            onPointerDown={(e, it) => {
              e.stopPropagation();
              onSelect?.(it.uid);
              setDragPos(toWorld(it));
              setDragging(it);
            }}
          />
        );
      })}
      {pet?.adopted && <Pet3D pet={pet} onClick={onPetClick} />}
      <Chibi config={me.config} pose={me.pose} expression={me.expression} x={me.x} motion={motion} />
      <Chibi config={partner.config} pose={partner.pose} expression={partner.expression} x={partner.x} flip motion={motion} visible={partner.visible !== false} />
      <Anchors myX={myX} partnerX={partnerX} anchors={anchors} bubbleRef={bubbleRef} labelRef={labelRef} />
      <DragController
        dragging={dragging}
        setDragPos={setDragPos}
        onDrop={(item, pos) => {
          if (pos) {
            const [x, y] = toPercent(item.id, pos);
            onMove?.(item.uid, x, y);
          }
          setDragging(null);
          setDragPos(null);
        }}
      />
    </Canvas>
  );
}
