import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { toon, flat } from '../avatar/chibi/materials';

// Small building blocks shared by every environment.

export function seeded(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Soft material helper (cached). */
export const mat = (color) => toon(color);
export const glowMat = (color, opacity = 1) => flat(color, opacity);

export function Box({ size = [1, 1, 1], color, position, rotation, ...rest }) {
  return (
    <mesh position={position} rotation={rotation} material={mat(color)} {...rest}>
      <boxGeometry args={size} />
    </mesh>
  );
}

/** Gradient sky dome (vertex colours from horizon to zenith). */
export function Sky({ top = '#0c1026', mid = '#2b2b4e', bottom = '#3a2a4a', radius = 60 }) {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(radius, 32, 24);
    const c = new Float32Array(g.attributes.position.count * 3);
    const t = new THREE.Color(top);
    const m = new THREE.Color(mid);
    const b = new THREE.Color(bottom);
    const col = new THREE.Color();
    for (let i = 0; i < g.attributes.position.count; i++) {
      const y = g.attributes.position.getY(i) / radius; // -1..1
      if (y > 0.15) col.copy(m).lerp(t, Math.min(1, (y - 0.15) / 0.6));
      else col.copy(b).lerp(m, Math.max(0, (y + 0.1) / 0.25));
      c.set([col.r, col.g, col.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    return g;
  }, [top, mid, bottom, radius]);
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} depthWrite={false} fog={false} />
    </mesh>
  );
}

/** Twinkling stars on a dome. */
export function Stars({ count = 400, radius = 50, minY = 0.05, seed = 7, size = 0.22 }) {
  const ref = useRef();
  const geo = useMemo(() => {
    const r = seeded(seed);
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = r() * Math.PI * 2;
      const v = minY + r() * (1 - minY);
      const s = Math.sqrt(1 - v * v);
      pos.set([Math.cos(u) * s * radius, v * radius, -Math.abs(Math.sin(u) * s * radius)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count, radius, minY, seed]);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.material.opacity = 0.75 + Math.sin(clock.elapsedTime * 1.3) * 0.2;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#fff6e8" size={size} sizeAttenuation transparent opacity={0.9} depthWrite={false} fog={false} />
    </points>
  );
}

/** Falling rain inside a box region. */
export function Rain({ count = 600, area = [12, 8, 4], center = [0, 4, -4], speed = 9, color = '#c8d2f0', opacity = 0.45 }) {
  const ref = useRef();
  const { geo, vel } = useMemo(() => {
    const r = seeded(3);
    const pos = new Float32Array(count * 6);
    const vel = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = center[0] + (r() - 0.5) * area[0];
      const y = center[1] + (r() - 0.5) * area[1];
      const z = center[2] + (r() - 0.5) * area[2];
      pos.set([x, y, z, x - 0.02, y - 0.25, z], i * 6);
      vel[i] = speed * (0.7 + r() * 0.6);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { geo: g, vel };
  }, [count, area, center, speed]);
  useFrame((_, dt) => {
    const p = geo.attributes.position;
    const bottom = center[1] - area[1] / 2;
    const top = center[1] + area[1] / 2;
    for (let i = 0; i < count; i++) {
      let y = p.array[i * 6 + 1] - vel[i] * Math.min(dt, 0.05);
      if (y < bottom) y = top;
      p.array[i * 6 + 1] = y;
      p.array[i * 6 + 4] = y - 0.25;
    }
    p.needsUpdate = true;
  });
  return (
    <lineSegments ref={ref} geometry={geo}>
      <lineBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </lineSegments>
  );
}

/** Drifting glowing motes (dust, fireflies, sparks). */
export function Motes({ count = 40, area = [8, 3, 5], center = [0, 1.5, 0], color = '#f2c98b', size = 0.06, rise = 0.12, seed = 5 }) {
  const ref = useRef();
  const base = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: count }, () => [center[0] + (r() - 0.5) * area[0], center[1] + (r() - 0.5) * area[1], center[2] + (r() - 0.5) * area[2], r() * 10]);
  }, [count, area, center, seed]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const a = geo.attributes.position.array;
    base.forEach(([x, y, z, o], i) => {
      a[i * 3] = x + Math.sin(t * 0.4 + o) * 0.25;
      a[i * 3 + 1] = y - area[1] / 2 + ((t * rise + o) % area[1]);
      a[i * 3 + 2] = z + Math.cos(t * 0.3 + o) * 0.2;
    });
    geo.attributes.position.needsUpdate = true;
    if (ref.current) ref.current.material.opacity = 0.6 + Math.sin(t * 2) * 0.25;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color={color} size={size} sizeAttenuation transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/** A sagging string of warm bulbs between two points. */
export function StringLights({ from = [-4, 3, -2.9], to = [4, 3, -2.9], sag = 0.5, count = 18, colors = ['#FFE2A8', '#F2C98B', '#E8B4A0', '#B8A7D9'] }) {
  const pts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const t = i / (count - 1);
        return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t - Math.sin(t * Math.PI) * sag, from[2] + (to[2] - from[2]) * t];
      }),
    [from, to, sag, count],
  );
  const group = useRef();
  useFrame(({ clock }) => {
    group.current?.children.forEach((c, i) => {
      if (c.userData.bulb) c.material.opacity = 0.75 + Math.sin(clock.elapsedTime * 2 + i) * 0.25;
    });
  });
  const bulbMats = useMemo(() => colors.map((c) => new THREE.MeshBasicMaterial({ color: c, transparent: true })), [colors]);
  const wire = useMemo(() => new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(...p))), [pts]);
  return (
    <group ref={group}>
      <line geometry={wire}>
        <lineBasicMaterial color="#2b2b3a" />
      </line>
      {pts.map((p, i) => (
        <mesh key={i} position={[p[0], p[1] - 0.06, p[2]]} userData={{ bulb: true }} material={bulbMats[i % bulbMats.length].clone()}>
          <sphereGeometry args={[0.055, 12, 10]} />
        </mesh>
      ))}
    </group>
  );
}

/** City skyline: instanced buildings with lit windows. */
export function Skyline({ z = -18, width = 50, seed = 4, color = '#141528', windowColor = '#F2C98B', maxH = 9, baseY = 0 }) {
  const { buildings, windows } = useMemo(() => {
    const r = seeded(seed);
    const buildings = [];
    const windows = [];
    let x = -width / 2;
    while (x < width / 2) {
      const w = 1.2 + r() * 2.2;
      const h = 2 + r() * maxH;
      const d = 1 + r() * 2;
      buildings.push({ x: x + w / 2, w, h, d, z: z - r() * 3 });
      for (let wy = baseY + 0.6; wy < baseY + h - 0.4; wy += 0.55) for (let wx = x + 0.3; wx < x + w - 0.3; wx += 0.45) if (r() < 0.22) windows.push([wx, wy, buildings.at(-1).z + d / 2 + 0.01, r()]);
      x += w + 0.2 + r() * 0.6;
    }
    return { buildings, windows };
  }, [z, width, seed, maxH, baseY]);
  const winGeo = useMemo(() => new THREE.PlaneGeometry(0.2, 0.26), []);
  return (
    <group>
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, baseY + b.h / 2, b.z]} material={glowMat(color)}>
          <boxGeometry args={[b.w, b.h, b.d]} />
        </mesh>
      ))}
      {windows.map(([x, y, wz, o], i) => (
        <mesh key={`w${i}`} geometry={winGeo} position={[x, y, wz]} material={glowMat(windowColor, 0.45 + o * 0.5)} />
      ))}
    </group>
  );
}

/** A flickering warm light (lamps, candles, fire). */
export function Flicker({ position, color = '#ffb46b', intensity = 3, distance = 8, speed = 1 }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed;
    if (ref.current) ref.current.intensity = intensity * (0.9 + Math.sin(t * 7.3) * 0.05 + Math.sin(t * 13.1) * 0.05);
  });
  return <pointLight ref={ref} position={position} color={color} intensity={intensity} distance={distance} decay={1.6} />;
}
