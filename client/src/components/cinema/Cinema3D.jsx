import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { buildChibi } from '../avatar/chibi/buildChibi';
import { applyPose } from '../avatar/chibi/pose';
import { mat, glowMat } from '../world3d/kit';

// ---- the building -----------------------------------------------------------
// Screen at the front (-z), eight stadium rows rising towards the back, a
// walkway along the back wall and a door out to the lobby, which is upstairs.
export const LOBBY_Y = 2.4;
const ROWS = 'ABCDEFGH';
const rowZ = (i) => -4.2 + i * 1.2;
const rowY = (i) => i * 0.3;
const seatX = (n) => (n - 7.5) * 0.95;
const AISLE_X = 7.4;
const SCREEN = { x: 0, y: 3.9, z: -8.2, w: 10.4, h: 5.85 };
const USHER_AT = [5.3, LOBBY_Y, 12.4];
const QUEUE = { me: [6.9, LOBBY_Y, 12.4], partner: [8.1, LOBBY_Y, 13.3] };

/** "F7" → where that seat is. */
export function seatSpot(seat) {
  const i = Math.max(0, ROWS.indexOf(seat?.[0] ?? 'F'));
  const n = Number(seat?.slice(1)) || 7;
  return { x: seatX(n), y: rowY(i), z: rowZ(i), row: i };
}

/** The walk from the ticket podium to a seat. */
function pathTo(seat, from) {
  const s = seatSpot(seat);
  const legroom = s.z - 0.62;
  return [
    from,
    [AISLE_X, LOBBY_Y, 10.4],
    [AISLE_X, LOBBY_Y, 8.2],
    [AISLE_X, LOBBY_Y, 5.3],
    [AISLE_X, s.y, legroom + 0.1],
    [s.x, s.y, legroom],
    [s.x, s.y, s.z],
  ].map((p) => new THREE.Vector3(...p));
}

const easeTo = (v, target, k) => v.lerp(target, k);

// ---- materials ---------------------------------------------------------------
const VELVET = '#7b2230';
const VELVET_DARK = '#561824';
const CARPET = '#2a1420';
const WALL = '#1c1419';

function Seats() {
  // One instanced mesh per part keeps 112 seats cheap.
  const refs = { cushion: useRef(), back: useRef(), arm: useRef() };
  const count = ROWS.length * 14;
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    let i = 0;
    let a = 0;
    for (let r = 0; r < ROWS.length; r++) {
      for (let n = 1; n <= 14; n++) {
        const x = seatX(n);
        const y = rowY(r);
        const z = rowZ(r);
        refs.cushion.current.setMatrixAt(i, m.makeTranslation(x, y + 0.45, z));
        refs.back.current.setMatrixAt(i, m.makeTranslation(x, y + 0.92, z + 0.36));
        refs.arm.current.setMatrixAt(a++, m.makeTranslation(x - 0.46, y + 0.62, z + 0.02));
        if (n === 14) refs.arm.current.setMatrixAt(a++, m.makeTranslation(x + 0.46, y + 0.62, z + 0.02));
        i++;
      }
    }
    Object.values(refs).forEach((ref) => (ref.current.instanceMatrix.needsUpdate = true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <group>
      <instancedMesh ref={refs.cushion} args={[null, mat(VELVET), count]}>
        <boxGeometry args={[0.8, 0.16, 0.72]} />
      </instancedMesh>
      <instancedMesh ref={refs.back} args={[null, mat(VELVET), count]}>
        <boxGeometry args={[0.82, 0.98, 0.16]} />
      </instancedMesh>
      <instancedMesh ref={refs.arm} args={[null, mat('#241018'), ROWS.length * 15]}>
        <boxGeometry args={[0.09, 0.34, 0.74]} />
      </instancedMesh>
    </group>
  );
}

function Auditorium({ houseLights }) {
  const stepLights = useMemo(() => Array.from({ length: ROWS.length }, (_, i) => i), []);
  return (
    <group>
      {/* stadium floor, one step per row */}
      {stepLights.map((i) => (
        <mesh key={i} position={[0, rowY(i) / 2 - 0.05, rowZ(i)]} material={mat(CARPET)}>
          <boxGeometry args={[17, rowY(i) + 0.1, 1.2]} />
        </mesh>
      ))}
      <mesh position={[0, -0.05, -7]} material={mat('#1a0f15')}>
        <boxGeometry args={[17, 0.1, 5.2]} />
      </mesh>
      {/* back walkway (level with the lobby) */}
      <mesh position={[0, LOBBY_Y / 2 - 0.05, 6.8]} material={mat(CARPET)}>
        <boxGeometry args={[17, LOBBY_Y + 0.1, 3.6]} />
      </mesh>
      {/* aisle step lights */}
      {stepLights.map((i) => (
        <mesh key={`l${i}`} position={[AISLE_X - 0.62, rowY(i) + 0.03, rowZ(i) - 0.55]} material={glowMat('#f2c98b')}>
          <boxGeometry args={[0.35, 0.03, 0.05]} />
        </mesh>
      ))}
      <Seats />
      {/* walls & ceiling */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 8.5, 4.5, 0]} material={mat(WALL)}>
            <boxGeometry args={[0.2, 10, 17.5]} />
          </mesh>
          {/* acoustic panels */}
          {[-4.5, -1, 2.5].map((z) => (
            <mesh key={z} position={[side * 8.38, 4.6, z]} material={mat('#2b1d25')}>
              <boxGeometry args={[0.06, 3.2, 2.6]} />
            </mesh>
          ))}
          {/* wall sconces */}
          {[-5.5, -2, 1.5, 5].map((z) => (
            <group key={`s${z}`} position={[side * 8.3, 5.9, z]}>
              <mesh material={glowMat('#ffcf8a', houseLights > 0.5 ? 1 : 0.55)}>
                <sphereGeometry args={[0.16, 12, 10]} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      <mesh position={[0, 9.4, 0]} material={mat('#120c10')}>
        <boxGeometry args={[17.2, 0.2, 17.5]} />
      </mesh>
      {/* back wall with the door to the lobby */}
      <mesh position={[-1.1, 5.6, 8.65]} material={mat(WALL)}>
        <boxGeometry args={[14.8, 7.8, 0.2]} />
      </mesh>
      <mesh position={[8.05, 5.6, 8.65]} material={mat(WALL)}>
        <boxGeometry args={[1.1, 7.8, 0.2]} />
      </mesh>
      <mesh position={[AISLE_X, LOBBY_Y + 3.4 + 1.8, 8.65]} material={mat(WALL)}>
        <boxGeometry args={[1.8, 3.6, 0.2]} />
      </mesh>
      {/* front wall around the screen */}
      <mesh position={[0, 4.5, -9.3]} material={mat('#0e0a0d')}>
        <boxGeometry args={[17, 10, 0.2]} />
      </mesh>
      {/* stage lip */}
      <mesh position={[0, 0.35, -8.4]} material={mat('#2a1a20')}>
        <boxGeometry args={[12.5, 0.7, 1.2]} />
      </mesh>
      {/* EXIT signs */}
      {[-7.6, 7.6].map((x) => (
        <mesh key={x} position={[x, 3.2, -9.15]} material={glowMat('#63d68a')}>
          <boxGeometry args={[0.6, 0.22, 0.04]} />
        </mesh>
      ))}
    </group>
  );
}

/** Title card for the screen before the film starts (poster + title). */
function titleCard(poster, title) {
  const c = document.createElement('canvas');
  c.width = 1280;
  c.height = 720;
  const g = c.getContext('2d');
  g.fillStyle = '#07070b';
  g.fillRect(0, 0, 1280, 720);
  if (poster) {
    g.globalAlpha = 0.35;
    g.filter = 'blur(28px)';
    g.drawImage(poster, -100, -300, 1480, 2220);
    g.filter = 'none';
    g.globalAlpha = 1;
    g.drawImage(poster, 120, 90, 360, 540);
  }
  g.fillStyle = '#f5ebdd';
  g.font = '600 64px Fraunces, Georgia, serif';
  g.textAlign = 'left';
  const words = title.split(' ');
  let line = '';
  let y = 300;
  for (const w of words) {
    if (g.measureText(`${line} ${w}`).width > 640 && line) {
      g.fillText(line, 560, y);
      line = w;
      y += 72;
    } else line = line ? `${line} ${w}` : w;
  }
  g.fillText(line, 560, y);
  g.font = '500 26px "DM Sans", system-ui, sans-serif';
  g.globalAlpha = 0.7;
  g.fillText('The film will begin shortly', 560, y + 60);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Screen({ video, poster, title, playing, curtainsOpen }) {
  const light = useRef();
  const left = useRef();
  const right = useRef();
  const videoTex = useMemo(() => {
    if (!video) return null;
    const t = new THREE.VideoTexture(video);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [video]);
  const cardTex = useMemo(() => titleCard(poster, title ?? ''), [poster, title]);
  useEffect(() => () => videoTex?.dispose(), [videoTex]);
  useEffect(() => () => cardTex.dispose(), [cardTex]);
  const showVideo = videoTex && playing !== null;
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    if (light.current) {
      const target = playing ? 7 + Math.sin(t * 3.1) * 0.9 + Math.sin(t * 7.3) * 0.5 : 2.5;
      light.current.intensity += (target - light.current.intensity) * Math.min(1, dt * 3);
    }
    const k = Math.min(1, dt * 1.4);
    const open = curtainsOpen ? 1 : 0;
    if (left.current) left.current.position.x += (-(2.6 + open * 5.1) - left.current.position.x) * k;
    if (right.current) right.current.position.x += (2.6 + open * 5.1 - right.current.position.x) * k;
  });
  return (
    <group>
      {/* frame */}
      <mesh position={[SCREEN.x, SCREEN.y, SCREEN.z - 0.06]} material={mat('#050507')}>
        <boxGeometry args={[SCREEN.w + 0.5, SCREEN.h + 0.5, 0.08]} />
      </mesh>
      <mesh position={[SCREEN.x, SCREEN.y, SCREEN.z]}>
        <planeGeometry args={[SCREEN.w, SCREEN.h]} />
        <meshBasicMaterial map={showVideo ? videoTex : cardTex} toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, 3.2, -4.5]} color="#b9cdf0" intensity={2.5} distance={22} decay={1.2} />
      {/* curtains */}
      {[left, right].map((ref, i) => (
        <group key={i} ref={ref} position={[i ? 2.6 : -2.6, SCREEN.y + 0.4, SCREEN.z + 0.35]}>
          {[-2, -1, 0, 1, 2].map((dx) => (
            <mesh key={dx} position={[dx * 0.5, 0, 0]} scale={[0.3, 1, 0.2]} material={mat(dx % 2 ? VELVET_DARK : VELVET)}>
              <cylinderGeometry args={[1, 1.12, 7.4, 14]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* valance */}
      <mesh position={[0, SCREEN.y + SCREEN.h / 2 + 0.75, SCREEN.z + 0.45]} material={mat(VELVET)}>
        <boxGeometry args={[13.5, 0.9, 0.3]} />
      </mesh>
    </group>
  );
}

function Poster({ canvas, position, rotation }) {
  const tex = useMemo(() => {
    if (!canvas) return null;
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [canvas]);
  useEffect(() => () => tex?.dispose(), [tex]);
  return (
    <group position={position} rotation={rotation}>
      {/* lightbox frame */}
      <mesh position={[0, 0, -0.04]} material={mat('#c9a15b')}>
        <boxGeometry args={[1.62, 2.37, 0.06]} />
      </mesh>
      <mesh>
        <planeGeometry args={[1.5, 2.25]} />
        {tex ? <meshBasicMaterial map={tex} toneMapped={false} /> : <meshBasicMaterial color="#2a2030" />}
      </mesh>
    </group>
  );
}

function Lobby({ posters }) {
  const L = LOBBY_Y;
  const lamps = [1, 4, 7, 10];
  return (
    <group>
      {/* floor with a runner */}
      <mesh position={[5.5, L - 0.05, 14.1]} material={mat('#3a1b27')}>
        <boxGeometry args={[14, 0.1, 11]} />
      </mesh>
      <mesh position={[AISLE_X, L + 0.005, 12.4]} rotation={[-Math.PI / 2, 0, 0]} material={mat('#8a2a3a')}>
        <planeGeometry args={[1.6, 7.6]} />
      </mesh>
      {/* walls */}
      <mesh position={[5.5, L + 3, 19.6]} material={mat('#2a1a22')}>
        <boxGeometry args={[14, 6, 0.2]} />
      </mesh>
      <mesh position={[-1.4, L + 3, 14.1]} material={mat('#2a1a22')}>
        <boxGeometry args={[0.2, 6, 11]} />
      </mesh>
      <mesh position={[12.4, L + 3, 14.1]} material={mat('#2a1a22')}>
        <boxGeometry args={[0.2, 6, 11]} />
      </mesh>
      <mesh position={[5.5, L + 5.9, 14.1]} material={mat('#1a1016')}>
        <boxGeometry args={[14, 0.2, 11]} />
      </mesh>
      {/* wainscot on the auditorium wall */}
      <mesh position={[3, L + 0.6, 8.78]} material={mat('#4a2230')}>
        <boxGeometry args={[8.6, 1.2, 0.06]} />
      </mesh>
      {/* SCREEN 1 sign over the door */}
      <group position={[AISLE_X, L + 3.05, 8.8]}>
        <mesh material={mat('#140c10')}>
          <boxGeometry args={[1.9, 0.5, 0.08]} />
        </mesh>
        <mesh position={[0, 0, 0.05]} material={glowMat('#f2c98b')}>
          <planeGeometry args={[1.6, 0.26]} />
        </mesh>
      </group>
      {/* door frame (the door itself is open) */}
      {[-0.95, 0.95].map((dx) => (
        <mesh key={dx} position={[AISLE_X + dx, L + 1.55, 8.75]} material={mat('#c9a15b')}>
          <boxGeometry args={[0.1, 3.1, 0.16]} />
        </mesh>
      ))}
      {/* velvet rope */}
      {[6.2, 8.6].map((x) => (
        <group key={x} position={[x, L, 10.4]}>
          <mesh position={[0, 0.5, 0]} material={mat('#c9a15b')}>
            <cylinderGeometry args={[0.05, 0.08, 1, 12]} />
          </mesh>
          <mesh position={[0, 1.02, 0]} material={mat('#e3c07a')}>
            <sphereGeometry args={[0.08, 12, 10]} />
          </mesh>
        </group>
      ))}
      {/* ticket podium */}
      <group position={[USHER_AT[0] + 0.72, L, USHER_AT[2]]}>
        <mesh position={[0, 0.55, 0]} material={mat('#5a2733')}>
          <boxGeometry args={[0.5, 1.1, 0.8]} />
        </mesh>
        <mesh position={[0, 1.12, 0]} rotation={[0, 0, 0.18]} material={mat('#c9a15b')}>
          <boxGeometry args={[0.58, 0.05, 0.88]} />
        </mesh>
      </group>
      {/* popcorn stand */}
      <group position={[10.6, L, 11.2]}>
        <mesh position={[0, 0.55, 0]} material={mat('#8a2a3a')}>
          <boxGeometry args={[1.5, 1.1, 0.8]} />
        </mesh>
        <mesh position={[0, 1.45, 0]} material={glowMat('#fff3c4', 0.35)}>
          <boxGeometry args={[1.1, 0.7, 0.6]} />
        </mesh>
        {Array.from({ length: 16 }, (_, i) => (
          <mesh key={i} position={[-0.4 + (i % 8) * 0.11, 1.2 + Math.floor(i / 8) * 0.08, -0.05 + (i % 3) * 0.08]} material={mat('#fff1c7')}>
            <sphereGeometry args={[0.05, 6, 5]} />
          </mesh>
        ))}
        <mesh position={[0, 2.1, 0]} material={glowMat('#ffcf6a')}>
          <boxGeometry args={[1.4, 0.3, 0.06]} />
        </mesh>
      </group>
      {/* posters: what's showing */}
      {posters.slice(0, 3).map((canvas, i) => (
        <Poster key={i} canvas={canvas} position={[[1.7, 3.8, 10.2][i], L + 2.3, 8.82]} rotation={[0, 0, 0]} />
      ))}
      {/* warm pendant lamps */}
      {lamps.map((x) => (
        <group key={x} position={[x, L + 5.2, 13]}>
          <mesh position={[0, 0.35, 0]} material={mat('#111')}>
            <cylinderGeometry args={[0.01, 0.01, 0.7, 4]} />
          </mesh>
          <mesh material={glowMat('#ffd49a')}>
            <sphereGeometry args={[0.18, 14, 10]} />
          </mesh>
        </group>
      ))}
      <pointLight position={[5.5, L + 4.5, 13]} intensity={16} distance={16} color="#ffc98f" decay={1.3} />
      <pointLight position={[AISLE_X, L + 2.4, 10]} intensity={4} distance={6} color="#ffd49a" decay={1.5} />
    </group>
  );
}

// ---- people --------------------------------------------------------------------
function Person({ config, pose, expression, target, facing, path, onArrive, visible = true, sitting, motion = true }) {
  const key = JSON.stringify(config);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const built = useMemo(() => buildChibi(config), [key]);
  useEffect(() => () => built.dispose(), [built]);
  const group = useRef();
  const walk = useRef(null); // { points, i }
  const arrived = useRef(onArrive);
  arrived.current = onArrive;

  useEffect(() => {
    if (!path) return;
    walk.current = { points: path, i: 1 };
    if (group.current) group.current.position.copy(path[0]);
  }, [path]);
  useLayoutEffect(() => {
    if (group.current && target && !path) {
      group.current.position.set(...target);
      group.current.rotation.y = facing ?? 0;
    }
    applyPose(built.parts, { pose, expression, snap: true, motion: false });
  }, [built]); // eslint-disable-line react-hooks/exhaustive-deps

  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    // Walk speed is real time, even on slow devices (only the easing is capped).
    const d = Math.min(dt, 0.1);
    const stepDt = Math.min(dt, 0.5);
    let walking = false;
    if (walk.current) {
      const { points } = walk.current;
      const next = points[walk.current.i];
      tmp.copy(next).sub(g.position);
      const dist = tmp.length();
      const step = 2.1 * stepDt;
      if (dist <= step) {
        g.position.copy(next);
        walk.current.i += 1;
        if (walk.current.i >= points.length) {
          walk.current = null;
          arrived.current?.();
        }
      } else {
        g.position.addScaledVector(tmp.normalize(), step);
        walking = true;
        const yaw = Math.atan2(tmp.x, tmp.z);
        g.rotation.y += (Math.atan2(Math.sin(yaw - g.rotation.y), Math.cos(yaw - g.rotation.y))) * Math.min(1, d * 10);
      }
    } else if (target) {
      tmp.set(...target);
      easeTo(g.position, tmp, Math.min(1, d * 4));
      const yaw = facing ?? 0;
      g.rotation.y += Math.atan2(Math.sin(yaw - g.rotation.y), Math.cos(yaw - g.rotation.y)) * Math.min(1, d * 5);
    }
    // Seated: drop the hips onto the cushion.
    built.root.position.y += ((sitting && !walking ? 0.52 - built.parts.hip + 0.02 : 0) - built.root.position.y) * Math.min(1, d * 6);
    applyPose(built.parts, { pose: walking ? 'walk' : pose, expression, t: state.clock.elapsedTime, dt: d, motion });
  });
  return (
    <group ref={group} visible={visible}>
      <primitive object={built.root} />
    </group>
  );
}

// ---- camera ------------------------------------------------------------------------
const SHOTS = {
  lobby: { pos: [6.6, LOBBY_Y + 3.0, 19.0], look: [6.3, LOBBY_Y + 1.25, 12.2] },
  seats: { pos: [0.2, 4.5, 7.4], look: [0, 3.0, -8] },
  screen: { pos: [0, SCREEN.y, -1.6], look: [SCREEN.x, SCREEN.y, SCREEN.z] },
};

function CameraRig({ view, follow, motion }) {
  const { camera, size, pointer } = useThree();
  const look = useRef(new THREE.Vector3(...SHOTS.lobby.look));
  const pos = useMemo(() => new THREE.Vector3(), []);
  const at = useMemo(() => new THREE.Vector3(), []);
  useLayoutEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    // Portrait phones need a wider lens to fit the screen in.
    camera.fov = THREE.MathUtils.clamp(42 / Math.min(1, aspect * 1.25), 42, 74);
    camera.position.set(...SHOTS.lobby.pos);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  useFrame(({ clock }, dt) => {
    const d = Math.min(dt, 0.1);
    const walker = follow.current?.children?.[0];
    if (view === 'walk' && walker) {
      const p = walker.position;
      if (p.z > 8.4) {
        // still in the lobby: watch them head for the door
        pos.set(...SHOTS.lobby.pos);
        at.set(p.x, p.y + 1.1, p.z);
      } else {
        // inside: a high shot from the back corner, following them down the steps
        // inside: from down by the screen, watching them come down the steps
        pos.set(-5.2, 7.6, -6.2);
        at.set(p.x * 0.6, p.y + 0.6, p.z);
      }
    } else {
      const shot = SHOTS[view] ?? SHOTS.seats;
      pos.set(...shot.pos);
      at.set(...shot.look);
      if (motion && view !== 'screen') {
        pos.x += Math.sin(clock.elapsedTime * 0.13) * 0.18 + pointer.x * 0.3;
        pos.y += pointer.y * 0.12;
      }
    }
    const k = 1 - Math.pow(view === 'screen' ? 0.12 : 0.2, d);
    camera.position.lerp(pos, k);
    look.current.lerp(at, k);
    camera.lookAt(look.current);
  });
  return null;
}

/** Keeps an HTML element (speech bubble) over a point in the scene. */
function Pin({ at, elRef }) {
  const { camera } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (!elRef?.current) return;
    v.set(...at).project(camera);
    // Keep the bubble on screen on narrow phones.
    elRef.current.style.left = `${THREE.MathUtils.clamp(((v.x + 1) / 2) * 100, 30, 70)}%`;
    elRef.current.style.top = `${((1 - v.y) / 2) * 100}%`;
    elRef.current.style.opacity = v.z < 1 ? '' : '0';
  });
  return null;
}

function HouseLights({ level }) {
  const hemi = useRef();
  useFrame((_, dt) => {
    if (hemi.current) hemi.current.intensity += (0.35 + level * 1.25 - hemi.current.intensity) * Math.min(1, dt * 1.5);
  });
  return <hemisphereLight ref={hemi} args={['#ffe2c4', '#2a1418', 1.6]} />;
}

const USHER = {
  presentation: 'masculine',
  skin: '#C98E6B',
  bodyType: 'average',
  height: 'average',
  faceShape: 'round',
  hair: { style: 'buzz', color: '#2B1D18' },
  face: { eyes: 'happy', eyeColor: '#3a2618', brows: 'straight', nose: 'button', mouth: 'grin', extra: 'blush' },
  outfit: { top: 'shirt-white', outer: 'blazer-char', bottom: 'trousers-char', shoes: 'loafers', hat: 'hat-cap' },
};

/**
 * The whole cinema in one scene. `view` picks the shot: lobby (ticket check),
 * walk (follow me to my seat), seats (theatre view), screen (zoomed on the film).
 */
export default function Cinema3D({ view, me, partner, usherPose = 'idle', screenVideo, poster, posters = [], title, playing, curtainsOpen, bubbleRef, onArrive, motion = true }) {
  const mine = useMemo(() => seatSpot(me.seat), [me.seat]);
  const theirs = useMemo(() => seatSpot(partner.seat), [partner.seat]);
  const myPath = useMemo(() => (me.stage === 'walking' ? pathTo(me.seat, QUEUE.me) : null), [me.stage, me.seat]);
  const theirPath = useMemo(() => (partner.stage === 'walking' ? pathTo(partner.seat, QUEUE.partner) : null), [partner.stage, partner.seat]);
  const follow = useRef(null);
  const seatedMe = ['seated', 'screen'].includes(me.stage);
  const seatedThem = ['seated', 'screen'].includes(partner.stage);

  return (
    <Canvas dpr={[1, 1.75]} gl={{ antialias: true, powerPreference: 'high-performance' }} camera={{ fov: 42, near: 0.1, far: 120 }} aria-hidden>
      <color attach="background" args={['#07050a']} />
      <fog attach="fog" args={['#07050a', 18, 42]} />
      <HouseLights level={playing ? 0 : 1} />
      <directionalLight position={[3, 8, 6]} intensity={0.5} color="#ffe6cc" />
      <CameraRig view={view} follow={follow} motion={motion} />
      <Auditorium houseLights={playing ? 0 : 1} />
      <Screen video={screenVideo} poster={poster} title={title} playing={playing} curtainsOpen={curtainsOpen} />
      <Lobby posters={posters} />
      <Person config={USHER} pose={usherPose} expression="happy" target={USHER_AT} facing={Math.PI / 2} motion={motion} />
      <Pin at={[USHER_AT[0], USHER_AT[1] + 2.35, USHER_AT[2]]} elRef={bubbleRef} />

      <group ref={follow}>
        <Person
          key={`me-${myPath ? 'walk' : 'still'}`}
          config={me.config}
          pose={seatedMe ? (me.cheer ? 'sitCheer' : 'sit') : me.pose ?? 'idle'}
          expression={me.expression}
          path={myPath}
          target={seatedMe ? [mine.x, mine.y, mine.z] : QUEUE.me}
          facing={seatedMe ? Math.PI : -Math.PI / 2}
          sitting={seatedMe}
          onArrive={onArrive}
          motion={motion}
        />
      </group>
      {partner.config && (
        <Person
          key={`them-${theirPath ? 'walk' : 'still'}`}
          config={partner.config}
          pose={seatedThem ? (partner.cheer ? 'sitCheer' : 'sit') : 'idle'}
          expression={partner.expression}
          path={theirPath}
          target={seatedThem ? [theirs.x, theirs.y, theirs.z] : QUEUE.partner}
          facing={seatedThem ? Math.PI : -Math.PI / 2}
          sitting={seatedThem}
          visible={partner.stage !== 'away'}
          motion={motion}
        />
      )}
    </Canvas>
  );
}
