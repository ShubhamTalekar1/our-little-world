import { getAudioContext, midiToFreq } from './context';

/**
 * A tiny generative "band": warm pad + soft bass + music-box arpeggio,
 * following each song's chord progression. It lets the music room and slow
 * dance make real sound without bundling or streaming copyrighted audio.
 * A real provider can replace this behind the same play/stop interface.
 */
class MusicEngine {
  constructor() {
    this.timer = null;
    this.master = null;
    this.song = null;
  }

  play(song, volume = 0.6) {
    if (!song) return;
    if (this.song?.id === song.id && this.timer) {
      this.setVolume(volume);
      return;
    }
    this.stop();
    const ctx = getAudioContext();
    if (!ctx) return;
    this.song = song;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.gain.linearRampToValueAtTime(0.32 * volume, ctx.currentTime + 1.2);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2400;
    this.master.connect(lp).connect(ctx.destination);
    this.delay = ctx.createDelay();
    this.delay.delayTime.value = 60 / song.bpm / 2;
    const fb = ctx.createGain();
    fb.gain.value = 0.28;
    this.delay.connect(fb).connect(this.delay);
    this.delay.connect(this.master);

    this.step = 0;
    this.nextTime = ctx.currentTime + 0.1;
    const eighth = 60 / song.bpm / 2;
    const schedule = () => {
      while (this.nextTime < ctx.currentTime + 0.4) {
        this.scheduleStep(ctx, this.step, this.nextTime, eighth);
        this.nextTime += eighth;
        this.step += 1;
      }
    };
    schedule();
    this.timer = setInterval(schedule, 120);
  }

  scheduleStep(ctx, step, t, eighth) {
    const song = this.song;
    const chord = song.chords[Math.floor(step / 16) % song.chords.length];
    const root = 57 + song.key; // around A3
    const barStep = step % 16;
    if (barStep === 0) {
      chord.forEach((iv, i) => this.voice(ctx, midiToFreq(root + iv), t, eighth * 16, i === 0 ? 0.05 : 0.035, 'triangle', 0.8));
      this.voice(ctx, midiToFreq(root + chord[0] - 12), t, eighth * 7, 0.09, 'sine', 0.05);
    }
    if (barStep === 8) this.voice(ctx, midiToFreq(root + chord[0] - 12), t, eighth * 7, 0.07, 'sine', 0.05);
    // gentle arpeggio, sparse and slightly humanised
    const pattern = [0, 2, 1, 3, 2, 1, 3, 2];
    if (barStep % 2 === 0 || Math.random() < 0.25) {
      const note = chord[pattern[barStep % 8]] + 12;
      const dest = this.delay;
      this.voice(ctx, midiToFreq(root + note), t + Math.random() * 0.015, eighth * 1.8, 0.05, 'sine', 0.005, dest);
    }
  }

  voice(ctx, freq, t, dur, gain, type, attack, dest) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = (Math.random() - 0.5) * 8;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(dest ?? this.master);
    if (dest) g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.1);
  }

  setVolume(v) {
    const ctx = getAudioContext();
    if (this.master && ctx) this.master.gain.linearRampToValueAtTime(0.32 * v, ctx.currentTime + 0.3);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
    const ctx = getAudioContext();
    if (this.master && ctx) {
      const m = this.master;
      m.gain.cancelScheduledValues(ctx.currentTime);
      m.gain.setValueAtTime(m.gain.value, ctx.currentTime);
      m.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      setTimeout(() => m.disconnect(), 800);
    }
    this.master = null;
    this.song = null;
  }
}

export const musicEngine = new MusicEngine();
