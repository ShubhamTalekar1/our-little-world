// Poses and the little motions that bring the chibi to life.
// Arm angles are degrees around z: 0 = hanging down, positive = hand moves
// towards the character's own left side (screen-left), negative = screen-right.
// Avatars face screen-right (towards their partner); `flip` mirrors them.
const D = Math.PI / 180;

export const POSES = {
  idle: { l: 8, r: -8 },
  wave: { l: 8, r: -150, wave: 'r' },
  hug: { l: -40, r: -80, fwd: 0.55, lean: -0.1, tilt: -0.14 },
  highfive: { l: 8, r: -165 },
  pat: { l: 8, r: -120, wave: 'r', waveAmp: 6 },
  dance: { l: -35, r: -95, fwd: 0.5, lean: -0.05, tilt: -0.12, sway: true },
  kiss: { l: 12, r: -22, lean: -0.1, tilt: -0.16 },
  heart: { l: 150, r: -150, heartArms: true },
  cheer: { l: 145, r: -145, jump: true },
};

const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Apply a pose. With `snap`, jump straight to it (thumbnails); otherwise ease
 * towards it each frame. `motion` enables the idle loops (breathing, blinking).
 */
export function applyPose(parts, { pose = 'idle', expression = null, t = 0, dt = 1, motion = true, snap = false }) {
  const p = POSES[pose] ?? POSES.idle;
  const k = snap ? 1 : 1 - Math.pow(0.0015, dt); // frame-rate independent easing

  let r = p.r;
  let l = p.l;
  if (p.wave && motion) {
    const amp = p.waveAmp ?? 18;
    if (p.wave === 'r') r += Math.sin(t * 9) * amp;
  }
  if (p.jump && motion) {
    const s = Math.sin(t * 7) * 8;
    l += s;
    r -= s;
  }
  parts.armL.rotation.z = lerp(parts.armL.rotation.z, -l * D, k);
  parts.armR.rotation.z = lerp(parts.armR.rotation.z, -r * D, k);
  const fwd = p.fwd ?? 0;
  parts.armL.rotation.x = lerp(parts.armL.rotation.x, -fwd, k);
  parts.armR.rotation.x = lerp(parts.armR.rotation.x, -fwd, k);
  const heartBend = p.heartArms ? 0.35 : 0;
  parts.armL.rotation.y = lerp(parts.armL.rotation.y, heartBend, k);
  parts.armR.rotation.y = lerp(parts.armR.rotation.y, -heartBend, k);

  // body
  const bob = motion ? Math.sin(t * 2.2) * 0.012 : 0;
  const jump = p.jump && motion ? Math.abs(Math.sin(t * 7)) * 0.1 : 0;
  parts.body.position.y = lerp(parts.body.position.y, bob + jump, snap ? 1 : 0.3);
  const sway = p.sway && motion ? Math.sin(t * 1.7) * 0.06 : 0;
  parts.body.rotation.z = lerp(parts.body.rotation.z, (p.lean ?? 0) + sway, k);
  parts.body.rotation.y = lerp(parts.body.rotation.y, p.sway && motion ? Math.sin(t * 0.85) * 0.12 : 0, k);

  // head
  const nod = motion ? Math.sin(t * 1.3 + 1) * 0.025 : 0;
  parts.head.rotation.z = lerp(parts.head.rotation.z, (p.tilt ?? 0) + nod, k);
  parts.head.rotation.x = lerp(parts.head.rotation.x, motion ? Math.sin(t * 0.9) * 0.03 : 0, k);

  // face: expression overrides
  const closed = expression === 'happy' || expression === 'kiss' || expression === 'love' || parts.happyEyes;
  const blinking = motion && !closed && t % 4.3 < 0.13;
  parts.eyesOpen.visible = !closed;
  parts.eyesClosed.visible = closed;
  parts.eyesOpen.scale.y = blinking ? 0.12 : 1;
  const mouth = expression === 'kiss' ? 'kiss' : expression === 'happy' || expression === 'love' ? 'grin' : expression === 'surprised' ? 'o' : parts.defaultMouth;
  for (const [key, m] of Object.entries(parts.mouths)) m.visible = key === mouth;
  parts.loveBlush.visible = expression === 'love' || expression === 'kiss';
}
