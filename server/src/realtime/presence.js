import { config } from '../config.js';

/**
 * Presence store. Uses Redis when REDIS_URL is set (so several API instances
 * agree on who's online); otherwise an in-memory map is plenty for two people.
 * Values: { status, activity, sockets, lastSeen }
 */
class MemoryPresence {
  constructor() {
    this.map = new Map();
  }
  async get(userId) {
    return this.map.get(userId) ?? null;
  }
  async set(userId, value) {
    this.map.set(userId, value);
  }
}

class RedisPresence {
  constructor(url) {
    this.ready = import('ioredis').then(({ default: Redis }) => {
      this.redis = new Redis(url, { lazyConnect: false, maxRetriesPerRequest: 2 });
      this.redis.on('error', (e) => console.warn('[presence] redis error:', e.message));
    });
  }
  async get(userId) {
    await this.ready;
    const raw = await this.redis.get(`presence:${userId}`);
    return raw ? JSON.parse(raw) : null;
  }
  async set(userId, value) {
    await this.ready;
    // Expire so a crashed instance can't leave someone "online" forever.
    await this.redis.set(`presence:${userId}`, JSON.stringify(value), 'EX', 60 * 60 * 12);
  }
}

export const presence = config.redisUrl ? new RedisPresence(config.redisUrl) : new MemoryPresence();

export async function markOnline(userId, socketId) {
  const cur = (await presence.get(userId)) ?? { sockets: [] };
  const sockets = [...new Set([...(cur.sockets ?? []), socketId])];
  const next = { status: 'online', activity: cur.activity ?? { type: 'room' }, sockets, lastSeen: new Date().toISOString() };
  await presence.set(userId, next);
  return { first: (cur.sockets ?? []).length === 0, value: next };
}

export async function markSocketGone(userId, socketId) {
  const cur = (await presence.get(userId)) ?? { sockets: [] };
  const sockets = (cur.sockets ?? []).filter((s) => s !== socketId);
  const next = { ...cur, sockets, status: sockets.length ? cur.status : 'offline', activity: sockets.length ? cur.activity : null, lastSeen: new Date().toISOString() };
  await presence.set(userId, next);
  return { last: sockets.length === 0, value: next };
}

export async function updateActivity(userId, { status, activity }) {
  const cur = (await presence.get(userId)) ?? { sockets: [] };
  const next = { ...cur, status: status ?? cur.status ?? 'online', activity: activity ?? null, lastSeen: new Date().toISOString() };
  await presence.set(userId, next);
  return next;
}

export async function publicPresence(userId, lastSeenAt) {
  const p = await presence.get(userId);
  if (!p || !p.sockets?.length) return { status: 'offline', activity: null, lastSeen: p?.lastSeen ?? lastSeenAt ?? null };
  return { status: p.status, activity: p.activity, lastSeen: p.lastSeen };
}
