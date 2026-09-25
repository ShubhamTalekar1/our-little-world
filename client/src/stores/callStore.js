import { create } from 'zustand';
import { DEMO_MODE } from '../config/env';
import { realtime } from '../services/realtime';
import { EV } from '../services/realtime/events';
import { Peer } from '../services/rtc/peer';
import { usePeopleStore } from './peopleStore';

let peer = null;
let offs = [];
let screenTrack = null;

/**
 * Call state for "Come sit with me". In demo mode the other person's video is
 * a live avatar (no remote media exists); your own camera is real if you
 * allow it. With a backend, a real peer connection is negotiated.
 */
export const useCallStore = create((set, get) => ({
  status: 'idle', // idle | connecting | connected
  local: null,
  remote: null,
  camOn: true,
  micOn: true,
  sharing: false,
  mediaError: null,
  startedAt: null,

  async join({ video = true } = {}) {
    if (get().status !== 'idle') return;
    set({ status: 'connecting', mediaError: null });
    let local = null;
    try {
      local = await navigator.mediaDevices.getUserMedia({ video, audio: true });
    } catch (e) {
      set({ mediaError: e?.name === 'NotAllowedError' ? 'Camera and mic are blocked — you can still sit together.' : 'No camera found — showing your avatar instead.', camOn: false, micOn: false });
    }
    set({ local, camOn: !!local?.getVideoTracks().length, micOn: !!local?.getAudioTracks().length });

    const myId = usePeopleStore.getState().me?.id ?? '';
    const partnerId = usePeopleStore.getState().partner?.id ?? '';
    const iOffer = myId < partnerId;

    if (!DEMO_MODE && typeof RTCPeerConnection !== 'undefined') {
      peer = new Peer({
        onRemoteStream: (remote) => set({ remote, status: 'connected', startedAt: get().startedAt ?? Date.now() }),
        onState: (s) => (s === 'failed' || s === 'disconnected') && set({ status: 'connecting' }),
      });
      peer.addStream(local);
    }
    const connected = () => set({ status: 'connected', startedAt: Date.now() });
    offs = [
      realtime.on(EV.RTC_ACCEPT, () => {
        if (peer && iOffer) peer.makeOffer();
        if (DEMO_MODE) connected();
      }),
      realtime.on(EV.RTC_CALL, () => {
        realtime.emit(EV.RTC_ACCEPT, {});
        if (peer && iOffer) peer.makeOffer();
      }),
      realtime.on(EV.RTC_END, () => set({ status: 'connecting', remote: null })),
    ];
    realtime.emit(EV.RTC_CALL, {});
  },

  toggleCam() {
    const t = get().local?.getVideoTracks()[0];
    if (!t) return false;
    t.enabled = !t.enabled;
    set({ camOn: t.enabled });
    return true;
  },
  toggleMic() {
    const t = get().local?.getAudioTracks()[0];
    if (!t) return false;
    t.enabled = !t.enabled;
    set({ micOn: t.enabled });
    return true;
  },
  async toggleScreen() {
    if (get().sharing) {
      screenTrack?.stop();
      screenTrack = null;
      const cam = get().local?.getVideoTracks()[0] ?? null;
      await peer?.replaceVideoTrack(cam);
      set({ sharing: false });
      return true;
    }
    if (!navigator.mediaDevices?.getDisplayMedia) return false;
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenTrack = s.getVideoTracks()[0];
      screenTrack.onended = () => get().sharing && get().toggleScreen();
      await peer?.replaceVideoTrack(screenTrack);
      set({ sharing: true, screen: s });
      return true;
    } catch {
      return false;
    }
  },

  leave() {
    realtime.emit(EV.RTC_END, {});
    offs.forEach((off) => off());
    offs = [];
    peer?.close();
    peer = null;
    screenTrack?.stop();
    get().local?.getTracks().forEach((t) => t.stop());
    set({ status: 'idle', local: null, remote: null, sharing: false, startedAt: null, screen: null });
  },
}));
