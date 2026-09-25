import { Server } from 'socket.io';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { verifyToken, COOKIE } from '../lib/auth.js';
import { RELAY } from './events.js';
import { setIo, userRoom } from './hub.js';
import { markOnline, markSocketGone, updateActivity, publicPresence } from './presence.js';

function cookieToken(header = '') {
  const m = header.split(';').map((s) => s.trim()).find((s) => s.startsWith(`${COOKIE}=`));
  return m ? decodeURIComponent(m.slice(COOKIE.length + 1)) : null;
}

export function attachRealtime(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: config.corsOrigins, credentials: true },
    maxHttpBufferSize: 256 * 1024,
  });
  setIo(io);

  // Authenticate every socket with the same session token as the API.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || cookieToken(socket.handshake.headers.cookie);
      const payload = verifyToken(token);
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.tokenVersion !== payload.v || !user.coupleId) return next(new Error('unauthorized'));
      const partner = await prisma.user.findFirst({ where: { coupleId: user.coupleId, NOT: { id: user.id } } });
      socket.data = { user, partnerId: partner?.id ?? null, tokens: 40, last: Date.now() };
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const { user } = socket.data;
    socket.join(userRoom(user.id));

    // Partner may have joined after this socket connected.
    const partnerId = async () => {
      if (!socket.data.partnerId) socket.data.partnerId = (await prisma.user.findFirst({ where: { coupleId: user.coupleId, NOT: { id: user.id } } }))?.id ?? null;
      return socket.data.partnerId;
    };
    const toPartner = async (event, payload) => {
      const pid = await partnerId();
      if (pid) io.to(userRoom(pid)).emit(event, { ...payload, from: user.id });
    };

    const { first, value } = await markOnline(user.id, socket.id);
    if (first) await toPartner('user:online', { activity: value.activity });
    // Tell this socket where the partner is right now.
    const pid = await partnerId();
    if (pid) {
      const p = await publicPresence(pid);
      if (p.status !== 'offline') socket.emit('user:online', { from: pid, activity: p.activity });
    }

    socket.onAny(async (event, payload) => {
      // Gentle token-bucket rate limit (≈20 events/sec sustained).
      const now = Date.now();
      socket.data.tokens = Math.min(40, socket.data.tokens + ((now - socket.data.last) / 1000) * 20);
      socket.data.last = now;
      if (socket.data.tokens < 1) return;
      socket.data.tokens -= 1;

      if (!RELAY.has(event) || (payload != null && typeof payload !== 'object')) return;
      const clean = { ...(payload ?? {}) };
      delete clean.from; // never trust a client-provided sender

      if (event === 'presence:update') await updateActivity(user.id, { status: clean.status, activity: clean.activity ?? null });
      if (event === 'chat:read' && (await partnerId())) {
        await prisma.message.updateMany({ where: { coupleId: user.coupleId, senderId: socket.data.partnerId, readAt: null }, data: { readAt: new Date() } });
      }
      await toPartner(event, clean);
    });

    socket.on('disconnect', async () => {
      const { last } = await markSocketGone(user.id, socket.id);
      if (last) {
        await prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
        await toPartner('user:offline', {});
      }
    });
  });

  return io;
}
