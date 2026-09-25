import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { prisma } from './db.js';
import { requireAuth, requireCouple } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import auth from './routes/auth.js';
import users from './routes/users.js';
import avatars from './routes/avatars.js';
import wardrobe from './routes/wardrobe.js';
import gifts from './routes/gifts.js';
import wallet from './routes/wallet.js';
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

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.use(cors({ origin: config.corsOrigins, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/api/health', async (_req, res) => {
    const db = await prisma.$queryRaw`SELECT 1`.then(() => 'ok').catch(() => 'unavailable');
    res.json({ ok: true, db });
  });

  app.use('/api/auth', auth);
  // Everything below is private to the signed-in couple.
  const priv = [requireAuth, requireCouple];
  app.use('/api/bootstrap', priv, bootstrap);
  app.use('/api/users', priv, users);
  app.use('/api/avatars', priv, avatars);
  app.use('/api/wardrobe', priv, wardrobe);
  app.use('/api/gifts', priv, gifts);
  app.use('/api/wallet', priv, wallet);
  app.use('/api/rooms', priv, rooms);
  app.use('/api/activities', priv, activities);
  app.use('/api/messages', priv, messages);
  app.use('/api/memories', priv, memories);
  app.use('/api/letters', priv, letters);
  app.use('/api/events', priv, events);
  app.use('/api/notifications', priv, notifications);
  app.use('/api/presence', priv, presence);
  app.use('/api/media', priv, media);

  app.use('/api', notFoundHandler);
  app.use(errorHandler);
  return app;
}
