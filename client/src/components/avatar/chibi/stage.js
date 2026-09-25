import * as THREE from 'three';

export const FOV = 26;

// What part of the character each crop shows (world units, feet at y = 0).
export const FRAMES = {
  full: { cy: 0.98, half: 1.07, aspect: 2 / 3 },
  head: { cy: 1.42, half: 0.62, aspect: 1 },
  torso: { cy: 0.78, half: 0.46, aspect: 1 },
  legs: { cy: 0.33, half: 0.36, aspect: 1 },
  feet: { cy: 0.08, half: 0.15, aspect: 100 / 70 },
};

export const cameraFor = (crop = 'full') => {
  const f = FRAMES[crop] ?? FRAMES.full;
  const dist = f.half / Math.tan((FOV / 2) * (Math.PI / 180));
  return { position: [0, f.cy + 0.05, dist], target: [0, f.cy, 0], aspect: f.aspect };
};

/** Warm key light, soft fill and a lavender rim — evening-lamp lighting. */
export function addLights(scene) {
  for (const l of LIGHTS) {
    const light = l.type === 'hemi' ? new THREE.HemisphereLight(l.sky, l.ground, l.intensity) : new THREE.DirectionalLight(l.color, l.intensity);
    if (l.position) light.position.set(...l.position);
    scene.add(light);
  }
}

export const LIGHTS = [
  { type: 'hemi', sky: '#fff8f0', ground: '#9a8290', intensity: 2.0 },
  { type: 'dir', color: '#ffe8d2', intensity: 1.5, position: [2, 3, 4] },
  { type: 'dir', color: '#fff4ea', intensity: 0.8, position: [0, 1, 5] },
  { type: 'dir', color: '#c9b8f0', intensity: 1.0, position: [-3, 2, -2] },
];


let webgl = null;
export function hasWebGL() {
  if (webgl !== null) return webgl;
  try {
    const c = document.createElement('canvas');
    webgl = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    webgl = false;
  }
  return webgl;
}
