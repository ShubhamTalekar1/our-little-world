import { io } from 'socket.io-client';
import { EV } from './events';

export class SocketTransport {
  constructor(hub, url, auth) {
    this.hub = hub;
    this.socket = io(url, { autoConnect: false, auth, transports: ['websocket', 'polling'] });
  }

  connect() {
    this.socket.onAny((event, payload) => this.hub.deliver(event, payload));
    this.socket.on('connect_error', (err) => this.hub.deliver('connection:error', { message: err.message }));
    this.socket.on('connect', () => this.hub.deliver('connection:ok', {}));
    this.socket.on('disconnect', () => this.hub.deliver(EV.USER_OFFLINE, { self: true }));
    this.socket.connect();
  }

  send(event, payload) {
    this.socket.emit(event, payload);
  }

  disconnect() {
    this.socket.disconnect();
  }
}
