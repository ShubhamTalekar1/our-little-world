import { useCallback, useEffect, useRef, useState } from 'react';

/** Record a short voice note with MediaRecorder. */
export function useVoiceRecorder({ maxSeconds = 60, onDone, onError } = {}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const rec = useRef(null);
  const chunks = useRef([]);
  const timer = useRef(null);
  const started = useRef(0);
  const cancelled = useRef(false);

  const cleanup = () => {
    clearInterval(timer.current);
    rec.current?.stream?.getTracks().forEach((t) => t.stop());
    rec.current = null;
    setRecording(false);
    setSeconds(0);
  };

  const stop = useCallback(() => rec.current?.state === 'recording' && rec.current.stop(), []);
  const cancel = useCallback(() => {
    cancelled.current = true;
    stop();
  }, [stop]);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      onError?.('Voice notes aren’t supported in this browser');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      cancelled.current = false;
      mr.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      mr.onstop = () => {
        const duration = Math.round((Date.now() - started.current) / 1000);
        const blob = new Blob(chunks.current, { type: mr.mimeType || 'audio/webm' });
        cleanup();
        if (!cancelled.current && duration >= 1) onDone?.(blob, duration);
      };
      rec.current = mr;
      mr.start();
      started.current = Date.now();
      setRecording(true);
      timer.current = setInterval(() => {
        const s = Math.round((Date.now() - started.current) / 1000);
        setSeconds(s);
        if (s >= maxSeconds) mr.stop();
      }, 250);
    } catch {
      onError?.('Microphone permission was blocked');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxSeconds, onDone, onError]);

  useEffect(() => () => cleanup(), []);
  return { recording, seconds, start, stop, cancel };
}
