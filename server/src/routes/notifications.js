import { Router } from 'express';
import { prisma } from '../db.js';
import { ah } from '../lib/errors.js';
import { serializeNotification } from '../services/notify.js';

const router = Router();

router.get(
  '/',
  ah(async (req, res) => {
    const rows = await prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 60 });
    res.json({ notifications: rows.map(serializeNotification) });
  }),
);

router.post(
  '/read-all',
  ah(async (req, res) => {
    await prisma.notification.updateMany({ where: { userId: req.user.id, read: false }, data: { read: true } });
    res.status(204).end();
  }),
);

router.post(
  '/:id/read',
  ah(async (req, res) => {
    await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: { read: true } });
    res.status(204).end();
  }),
);

export default router;
