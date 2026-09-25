import * as THREE from 'three';

// (Kept for experimentation: a stepped toon ramp.)
let gradient = null;
export function toonGradient() {
  if (gradient) return gradient;
  const data = new Uint8Array([178, 178, 178, 255, 222, 222, 222, 255, 255, 255, 255, 255, 255, 255, 255, 255]);
  gradient = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  return gradient;
}

const cache = new Map();

/** Shared, cached materials. Never dispose these per-avatar. */
export function toon(color, side = THREE.FrontSide) {
  const key = `toon:${color}:${side}`;
  // Smooth, slightly satin finish — like a little vinyl figure.
  if (!cache.has(key)) cache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0, side }));
  return cache.get(key);
}

export function flat(color, opacity = 1) {
  const key = `flat:${color}:${opacity}`;
  if (!cache.has(key)) {
    cache.set(key, new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity === 1 }));
  }
  return cache.get(key);
}

export function shiny(color) {
  const key = `shiny:${color}`;
  if (!cache.has(key)) cache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.6 }));
  return cache.get(key);
}

export const OUTLINE = new THREE.MeshBasicMaterial({ color: '#2a1d22', side: THREE.BackSide });
