import * as THREE from 'three';
import { useEffect, useState } from 'react';
import { buildChibi } from './buildChibi';
import { applyPose } from './pose';
import { addLights, cameraFor, FOV } from './stage';

/**
 * Thumbnails (wardrobe tiles, chat bubbles, the header…) are rendered once by
 * a single shared WebGL renderer and cached as images. Browsers only allow a
 * handful of live WebGL canvases per page, so only "hero" avatars are live.
 */
let renderer = null;
let scene = null;
let camera = null;
const cache = new Map();
const pending = new Map();
const queue = [];
let scheduled = false;

function init() {
  const canvas = document.createElement('canvas');
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  scene = new THREE.Scene();
  addLights(scene);
  camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
}

function render({ config, crop, flip, pose, expression, px }) {
  if (!renderer) init();
  const built = buildChibi(config);
  applyPose(built.parts, { pose, expression, snap: true, motion: false });
  const holder = new THREE.Group();
  holder.add(built.root);
  holder.scale.x = flip ? -1 : 1;
  holder.rotation.y = flip ? -0.32 : 0.32;
  scene.add(holder);
  const cam = cameraFor(crop);
  const w = Math.round(px * cam.aspect);
  renderer.setSize(w, px, false);
  camera.aspect = cam.aspect;
  camera.position.set(...cam.position);
  camera.lookAt(...cam.target);
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL('image/png');
  scene.remove(holder);
  built.dispose();
  return url;
}

function pump() {
  scheduled = false;
  const start = performance.now();
  while (queue.length && performance.now() - start < 12) {
    const job = queue.shift();
    let url = null;
    try {
      url = render(job.args);
    } catch {
      url = null;
    }
    if (cache.size > 400) cache.delete(cache.keys().next().value);
    cache.set(job.key, url);
    pending.get(job.key)?.forEach((fn) => fn(url));
    pending.delete(job.key);
  }
  if (queue.length) schedule();
}
function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(pump);
}

export function requestSnapshot(key, args) {
  if (cache.has(key)) return Promise.resolve(cache.get(key));
  return new Promise((resolve) => {
    if (!pending.has(key)) {
      pending.set(key, []);
      queue.push({ key, args });
      schedule();
    }
    pending.get(key).push(resolve);
  });
}

const BUCKETS = [64, 96, 128, 192, 256, 384, 512];
export function useChibiSnapshot({ config, crop = 'full', flip = false, pose = 'idle', expression = null, size = 120 }) {
  const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;
  const px = BUCKETS.find((b) => b >= size * dpr) ?? 512;
  const args = { config, crop, flip, pose, expression, px };
  const key = JSON.stringify(args);
  const [url, setUrl] = useState(() => cache.get(key) ?? null);
  useEffect(() => {
    let alive = true;
    if (cache.has(key)) {
      setUrl(cache.get(key));
      return undefined;
    }
    requestSnapshot(key, args).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return url;
}
