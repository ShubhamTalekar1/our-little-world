import { ICE_SERVERS } from '../../config/env';
import { realtime } from '../realtime';
import { EV } from '../realtime/events';

/**
 * A thin RTCPeerConnection wrapper. Signaling travels over the realtime hub
 * (rtc:offer / rtc:answer / rtc:ice), so swapping Socket.IO for another
 * signaling channel only means changing the hub transport.
 */
export class Peer {
  constructor({ onRemoteStream, onState }) {
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.remote = new MediaStream();
    this.pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach((t) => this.remote.addTrack(t));
      onRemoteStream?.(this.remote);
    };
    this.pc.onicecandidate = (e) => e.candidate && realtime.emit(EV.RTC_ICE, { candidate: e.candidate.toJSON() });
    this.pc.onconnectionstatechange = () => onState?.(this.pc.connectionState);
    this.offs = [
      realtime.on(EV.RTC_OFFER, (p) => this.onOffer(p)),
      realtime.on(EV.RTC_ANSWER, (p) => this.onAnswer(p)),
      realtime.on(EV.RTC_ICE, (p) => this.onIce(p)),
    ];
  }

  addStream(stream) {
    stream?.getTracks().forEach((t) => this.pc.addTrack(t, stream));
  }

  async replaceVideoTrack(track) {
    const sender = this.pc.getSenders().find((s) => s.track?.kind === 'video');
    if (sender) await sender.replaceTrack(track);
  }

  async makeOffer() {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    realtime.emit(EV.RTC_OFFER, { sdp: offer });
  }

  async onOffer({ sdp }) {
    await this.pc.setRemoteDescription(sdp);
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    realtime.emit(EV.RTC_ANSWER, { sdp: answer });
  }

  async onAnswer({ sdp }) {
    if (this.pc.signalingState === 'have-local-offer') await this.pc.setRemoteDescription(sdp);
  }

  async onIce({ candidate }) {
    try {
      await this.pc.addIceCandidate(candidate);
    } catch {
      /* late candidates after close are fine to drop */
    }
  }

  close() {
    this.offs.forEach((off) => off());
    this.pc.close();
  }
}
