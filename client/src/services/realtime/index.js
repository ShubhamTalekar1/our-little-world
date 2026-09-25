import { DEMO_MODE, SOCKET_URL } from '../../config/env';

/**
 * Transport-agnostic realtime hub.
 *   realtime.on(event, fn)  → unsubscribe()
 *   realtime.emit(event, payload)
 * In demo mode the transport is an in-browser simulated partner; otherwise a
 * Socket.IO connection to the API server, which relays events to the other
 * person in the couple (and only them).
 */
class Realtime {
  constructor() {
    this.handlers = new Map();
    this.transport = null;
    this.connected = false;
  }

  on(event, fn) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event).add(fn);
    return () => this.handlers.get(event)?.delete(fn);
  }

  /** Something arrived from the other person. */
  deliver(event, payload) {
    this.handlers.get(event)?.forEach((fn) => fn(payload));
    this.handlers.get('*')?.forEach((fn) => fn(event, payload));
  }

  emit(event, payload = {}) {
    this.transport?.send(event, { ...payload, sentAt: Date.now() });
  }

  async connect(auth) {
    if (this.transport) return;
    if (DEMO_MODE) {
      const { DemoTransport } = await import('./demoTransport');
      this.transport = new DemoTransport(this);
    } else {
      const { SocketTransport } = await import('./socketTransport');
      this.transport = new SocketTransport(this, SOCKET_URL, auth);
    }
    this.transport.connect();
    this.connected = true;
  }

  disconnect() {
    this.transport?.disconnect();
    this.transport = null;
    this.connected = false;
  }
}

export const realtime = new Realtime();
