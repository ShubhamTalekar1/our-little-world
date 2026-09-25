import fs from 'node:fs';
import path from 'node:path';

const env = process.env;
const isProd = env.NODE_ENV === 'production';

// Fail fast on a misconfigured production deploy rather than half-working.
const problems = [];
if (!env.DATABASE_URL) problems.push('DATABASE_URL is not set');
if (isProd && (!env.JWT_SECRET || env.JWT_SECRET.length < 32)) problems.push('JWT_SECRET must be set to a random string of at least 32 characters');
if (problems.length) {
  // eslint-disable-next-line no-console
  console.error(`\n✗ Configuration problem:\n  - ${problems.join('\n  - ')}\n`);
  if (isProd) process.exit(1);
}

const list = (v, fallback) => (v ?? fallback).split(',').map((s) => s.trim()).filter(Boolean);

const staticDir = env.STATIC_DIR ?? path.resolve(new URL('.', import.meta.url).pathname, '../public');

export const config = {
  isProd,
  port: Number(env.PORT ?? 4000),
  jwtSecret: env.JWT_SECRET ?? 'dev-only-secret-change-me',
  jwtTtl: '30d',
  // Only needed when the web app is hosted on a different origin than the API.
  corsOrigins: list(env.CORS_ORIGINS, 'http://localhost:5173'),
  // Secure cookies need HTTPS. Keep true in production unless testing over plain http.
  cookieSecure: env.COOKIE_SECURE ? env.COOKIE_SECURE === 'true' : isProd,
  redisUrl: env.REDIS_URL || null,
  uploadDir: env.UPLOAD_DIR ?? path.resolve(new URL('.', import.meta.url).pathname, '../uploads'),
  maxUploadBytes: 8 * 1024 * 1024,
  // The built web app (client/dist) served from the same origin, if present.
  staticDir: fs.existsSync(path.join(staticDir, 'index.html')) ? staticDir : null,
  // Keep in sync with the client's VITE_FEATURES / VITE_RELATIONSHIP.
  features: new Set(list(env.ENABLED_FEATURES, 'chat,movie')),
  relationship: env.RELATIONSHIP === 'couple' ? 'couple' : 'friends',
  // WebRTC: STUN/TURN servers handed to signed-in clients (credentials stay server-side config).
  iceServers: [
    ...list(env.STUN_URLS, 'stun:stun.l.google.com:19302').map((urls) => ({ urls })),
    ...(env.TURN_URLS ? [{ urls: list(env.TURN_URLS, ''), username: env.TURN_USERNAME ?? '', credential: env.TURN_CREDENTIAL ?? '' }] : []),
  ],
};
