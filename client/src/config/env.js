// Single place that reads build-time configuration. Nothing secret lives in
// the frontend — these are all public values.
const env = import.meta.env;

export const DEMO_MODE = env.VITE_DEMO_MODE !== 'false';
export const API_URL = env.VITE_API_URL || '';
export const SOCKET_URL = env.VITE_SOCKET_URL || undefined; // same origin by default
export const ICE_SERVERS = (env.VITE_ICE_SERVERS || 'stun:stun.l.google.com:19302')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .map((urls) => ({ urls }));
