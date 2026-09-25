import { DemoPartner } from './demoPartner';

/**
 * In-browser transport: whatever "I" emit goes to a simulated partner, and
 * whatever the partner does is delivered back through the hub exactly like a
 * socket event would be. Swapping to SocketTransport changes nothing else.
 */
export class DemoTransport {
  constructor(hub) {
    this.hub = hub;
    this.partner = new DemoPartner((event, payload) => this.hub.deliver(event, payload));
  }
  connect() {
    this.partner.start();
  }
  send(event, payload) {
    // small network-ish latency
    setTimeout(() => this.partner.receive(event, payload), 120 + Math.random() * 200);
  }
  disconnect() {
    this.partner.stop();
  }
}
