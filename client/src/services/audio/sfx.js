import { getAudioContext, midiToFreq } from './context';
import { useSettingsStore } from '../../stores/settingsStore';

// Small synthesized UI sounds. Everything respects the mute setting.
function tone(ctx, out, { freq, start, dur = 0.5, type = 'sine', gain = 0.2, attack = 0.01 }) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(out);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

const PATTERNS = {
  // soft rising arpeggio
  gift: [[76, 0], [79, 0.09], [83, 0.18], [88, 0.3]],
  notification: [[81, 0], [88, 0.12]],
  message: [[84, 0], [79, 0.07]],
  heart: [[72, 0], [76, 0.1], [79, 0.2]],
  success: [[72, 0], [79, 0.1]],
  open: [[67, 0], [71, 0.08], [74, 0.16], [79, 0.24], [83, 0.32], [86, 0.4]],
  tap: [[88, 0]],
};

export function playSfx(name) {
  const { soundEnabled, volume } = useSettingsStore.getState();
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const out = ctx.createGain();
  out.gain.value = 0.5 * volume;
  out.connect(ctx.destination);
  const t = ctx.currentTime + 0.02;
  (PATTERNS[name] ?? PATTERNS.tap).forEach(([m, dt]) => {
    tone(ctx, out, { freq: midiToFreq(m), start: t + dt, dur: 0.9, gain: 0.16, type: 'sine' });
    tone(ctx, out, { freq: midiToFreq(m + 12), start: t + dt, dur: 0.4, gain: 0.04, type: 'triangle' });
  });
}
