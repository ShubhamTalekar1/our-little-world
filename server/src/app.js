import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { prisma } from './db.js';
import { requireAuth, requireCouple } from './middleware/auth.js';
import { requireFeature } from './middleware/features.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import auth from './routes/auth.js';
import users from './routes/users.js';
import avatars from './routes/avatars.js';
import wardrobe from './routes/wardrobe.js';
import gifts from './routes/gifts.js';
import rooms from './routes/rooms.js';
import activities from './routes/activities.js';
import messages from './routes/messages.js';
import memories from './routes/memories.js';
import letters from './routes/letters.js';
import events from './routes/events.js';
import notifications from './routes/notifications.js';
import presence from './routes/presence.js';
import media from './routes/media.js';
import bootstrap from './routes/bootstrap.js';
import rtc from './routes/rtc.js';

// What the web app is allowed to load. Everything else is blocked.
const csp = {
  useDefaults: true,
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", 'https://www.youtube.com', 'https://s.ytimg.com'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
    imgSrc: ["'self'", 'data:', 'blob:', 'https://i.ytimg.com'],
    // Films can come from any https link someone pastes.
    mediaSrc: ["'self'", 'data:', 'blob:', 'https:'],
    connectSrc: ["'self'", 'ws:', 'wss:'],
    frameSrc: ['https://www.youtube.com', 'https://www.youtube-nocookie.com'],
    workerSrc: ["'self'", 'blob:'],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: config.cookieSecure ? [] : null,
  },
};

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: csp,
      crossOriginEmbedderPolicy: false, // YouTube embeds
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );
  app.use(compression());
  app.use('/api', cors({ origin: config.corsOrigins, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/api/health', async (_req, res) => {
    const db = await prisma.$queryRaw`SELECT 1`.then(() => 'ok').catch(() => 'unavailable');
    res.status(db === 'ok' ? 200 : 503).json({ ok: db === 'ok', db });
  });

  // A generous overall limit — two people will never hit it, scripts will.
  app.use('/api', rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Slow down a little 🙂' } }));

  app.use('/api/auth', auth);
  // Everything below is private to the signed-in couple.
  const priv = [requireAuth, requireCouple];
  app.use('/api/bootstrap', priv, bootstrap);
  app.use('/api/users', priv, users);
  app.use('/api/avatars', priv, avatars);
  app.use('/api/rooms', priv, rooms);
  app.use('/api/activities', priv, activities);
  app.use('/api/notifications', priv, notifications);
  app.use('/api/presence', priv, presence);
  app.use('/api/media', priv, media);
  app.use('/api/rtc', priv, rtc);
  app.use('/api/messages', priv, requireFeature('chat'), messages);
  // Features that can be locked for now (see ENABLED_FEATURES).
  app.use('/api/wardrobe', priv, requireFeature('wardrobe'), wardrobe);
  app.use('/api/gifts', priv, requireFeature('gifts'), gifts);
  app.use('/api/memories', priv, requireFeature('memories'), memories);
  app.use('/api/letters', priv, requireFeature('letters'), letters);
  app.use('/api/events', priv, requireFeature('dates'), events);

  app.use('/api', notFoundHandler);

  // The web app itself (same origin → cookies and sockets just work).
  if (config.staticDir) {
    app.use(
      express.static(config.staticDir, {
        index: false,
        setHeaders(res, file) {
          // Hashed assets are immutable; everything else revalidates.
          if (file.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          else res.setHeader('Cache-Control', 'no-cache');
        },
      }),
    );
    // Client-side routes (/chat, /together/movie, …) all get the app shell.
    app.get(/^(?!\/api\/|\/socket\.io\/).*/, (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(config.staticDir, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
