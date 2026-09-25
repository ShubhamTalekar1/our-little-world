// One shared AudioContext, created lazily on first user-initiated sound so we
// never autoplay anything.
let ctx = null;
export function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  // Never make the first sound before the person has interacted with the page.
  if (!ctx && navigator.userActivation && !navigator.userActivation.hasBeenActive) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}
export const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);
