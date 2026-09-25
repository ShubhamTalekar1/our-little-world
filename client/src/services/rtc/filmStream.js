import { realtime } from '../realtime';
import { EV } from '../realtime/events';
import { currentIceServers } from './peer';

/**
 * Streams a film playing on the host's device to the other person over WebRTC.
 * The host captures the <video> element (picture + sound), so the viewer sees
 * exactly what the host plays — always in sync, and she doesn't need the file.
 *
 * Signaling uses its own events (stream:*) so it never collides with calls.
 */

// Ask Opus for stereo, music-quality audio instead of the voice defaults.
function hifiAudio(sdp) {
  const m = sdp.match(/a=rtpmap:(\d+) opus\/48000/i);
  if (!m) return sdp;
  const pt = m[1];
  return sdp.replace(new RegExp(`a=fmtp:${pt} ([^\\r\\n]*)`), (line, params) =>
    params.includes('stereo=1') ? line : `a=fmtp:${pt} ${params};stereo=1;sprop-stereo=1;maxaveragebitrate=192000`,
  );
}

class Link {
  constructor(id, onState) {
    this.id = id;
    this.pc = new RTCPeerConnection({ iceServers: currentIceServers() });
    this.pending = [];
    this.pc.onicecandidate = (e) => e.candidate && realtime.emit(EV.STREAM_ICE, { id, candidate: e.candidate.toJSON() });
    this.pc.onconnectionstatechange = () => onState?.(this.pc.connectionState);
  }

  async addIce(candidate) {
    // Candidates can arrive before the description they belong to: hold them.
    if (!this.pc.remoteDescription) return this.pending.push(candidate);
    try {
      await this.pc.addIceCandidate(candidate);
    } catch {
      /* stale candidate */
    }
  }

  async setRemote(sdp) {
    await this.pc.setRemoteDescription(sdp);
    const queued = this.pending.splice(0);
    for (const c of queued) await this.addIce(c);
  }

  close() {
    try {
      this.pc.close();
    } catch {
      /* already closed */
    }
  }
}

/** The side with the film. */
export class FilmHost {
  constructor({ onState } = {}) {
    this.onState = onState;
    this.stream = null;
    this.link = null;
    this.offs = [
      realtime.on(EV.STREAM_ANSWER, ({ id, sdp }) => id === this.link?.id && this.link.setRemote(sdp).catch(() => {})),
      realtime.on(EV.STREAM_ICE, ({ id, candidate }) => id === this.link?.id && this.link.addIce(candidate)),
      realtime.on(EV.STREAM_REQUEST, () => this.stream && this.offer()),
    ];
  }

  /** Start sharing a <video> element that is playing (or about to play) a local file. */
  share(video) {
    const capture = video.captureStream?.bind(video) ?? video.mozCaptureStream?.bind(video);
    if (!capture) throw new Error('This browser can’t stream a film. Try Chrome, Edge or Firefox on a computer.');
    this.stream = capture();
    // Tracks appear (and are replaced) as the file loads: renegotiate when they change.
    let t;
    const renegotiate = () => {
      clearTimeout(t);
      t = setTimeout(() => this.stream?.getTracks().length && this.offer(), 250);
    };
    this.stream.addEventListener('addtrack', renegotiate);
    this.stream.addEventListener('removetrack', renegotiate);
    if (this.stream.getTracks().length) this.offer();
  }

  async offer() {
    this.link?.close();
    const link = new Link(Math.random().toString(36).slice(2, 10), this.onState);
    this.link = link;
    for (const track of this.stream.getTracks()) {
      if (track.kind === 'video') track.contentHint = 'motion';
      link.pc.addTrack(track, this.stream);
    }
    const offer = await link.pc.createOffer();
    await link.pc.setLocalDescription({ type: 'offer', sdp: hifiAudio(offer.sdp) });
    if (this.link !== link) return; // a newer offer replaced this one
    realtime.emit(EV.STREAM_OFFER, { id: link.id, sdp: link.pc.localDescription.toJSON() });
    // A film deserves more than webcam bitrate.
    for (const sender of link.pc.getSenders()) {
      if (sender.track?.kind !== 'video') continue;
      try {
        const p = sender.getParameters();
        p.encodings = p.encodings?.length ? p.encodings : [{}];
        p.encodings[0].maxBitrate = 5_000_000;
        p.degradationPreference = 'maintain-resolution';
        await sender.setParameters(p);
      } catch {
        /* not supported: defaults are fine */
      }
    }
  }

  stop() {
    realtime.emit(EV.STREAM_STOP, {});
    this.link?.close();
    this.link = null;
    this.stream = null;
  }

  destroy() {
    this.stop();
    this.offs.forEach((o) => o());
  }
}

/** The side watching. */
export class FilmViewer {
  constructor({ onStream, onState } = {}) {
    this.onStream = onStream;
    this.onState = onState;
    this.link = null;
    this.offs = [
      realtime.on(EV.STREAM_OFFER, ({ id, sdp }) => this.accept(id, sdp)),
      realtime.on(EV.STREAM_ICE, ({ id, candidate }) => id === this.link?.id && this.link.addIce(candidate)),
      realtime.on(EV.STREAM_STOP, () => {
        this.link?.close();
        this.link = null;
        this.onStream?.(null);
      }),
    ];
  }

  /** Ask the host to (re)send the film — on arrival or after a hiccup. */
  request() {
    realtime.emit(EV.STREAM_REQUEST, {});
  }

  async accept(id, sdp) {
    this.link?.close();
    const link = new Link(id, this.onState);
    this.link = link;
    const media = new MediaStream();
    link.pc.ontrack = (e) => {
      if (!media.getTracks().includes(e.track)) media.addTrack(e.track);
      this.onStream?.(media);
    };
    try {
      await link.setRemote(sdp);
      const answer = await link.pc.createAnswer();
      await link.pc.setLocalDescription({ type: 'answer', sdp: hifiAudio(answer.sdp) });
      realtime.emit(EV.STREAM_ANSWER, { id, sdp: link.pc.localDescription.toJSON() });
    } catch {
      this.onState?.('failed');
    }
  }

  destroy() {
    this.offs.forEach((o) => o());
    this.link?.close();
    this.link = null;
  }
}
