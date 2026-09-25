import { Router } from 'express';
import { prisma } from '../db.js';
import { ah, notFound } from '../lib/errors.js';
import { validate, text, clientId, isoDate, z } from '../lib/validate.js';
import { partnerOf } from '../middleware/auth.js';
import { notify } from '../services/notify.js';
import { emitToUser } from '../realtime/hub.js';
import * as S from '../services/serialize.js';

const router = Router();
const TYPES = ['date', 'movie', 'call', 'birthday', 'anniversary', 'important'];

router.get(
  '/',
  ah(async (req, res) => {
    const [events, countdowns] = await Promise.all([
      prisma.sharedEvent.findMany({ where: { coupleId: req.coupleId }, orderBy: { at: 'asc' } }),
      prisma.countdown.findMany({ where: { coupleId: req.coupleId } }),
    ]);
    res.json({ events: events.map(S.event), countdowns: countdowns.map(S.countdown) });
  }),
);

router.post(
  '/',
  validate(z.object({ id: clientId, title: text(80).pipe(z.string().min(1)), emoji: text(8).optional(), type: z.enum(TYPES), at: isoDate, reminder: z.number().int().min(0).max(10080).optional(), note: text(200).optional() })),
  ah(async (req, res) => {
    const e = await prisma.sharedEvent.create({ data: { ...req.valid, coupleId: req.coupleId, creatorId: req.user.id } });
    const partner = await partnerOf(req.user);
    if (partner) {
      emitToUser(partner.id, 'event:created', { from: req.user.id, event: S.event(e) });
      await notify(partner.id, { type: 'event', title: `New plan: ${e.title} ${e.emoji}`, body: e.at.toISOString(), link: '/dates' });
    }
    res.status(201).json({ event: S.event(e) });
  }),
);

router.delete(
  '/:id',
  ah(async (req, res) => {
    await prisma.sharedEvent.deleteMany({ where: { id: req.params.id, coupleId: req.coupleId } });
    res.status(204).end();
  }),
);

router.post(
  '/countdowns',
  validate(z.object({ id: clientId, title: text(60).pipe(z.string().min(1)), emoji: text(8).optional(), target: isoDate, accent: z.enum(['peach', 'lavender', 'lamp', 'sage']).optional(), pinned: z.boolean().optional() })),
  ah(async (req, res) => {
    const c = await prisma.countdown.create({ data: { ...req.valid, coupleId: req.coupleId } });
    res.status(201).json({ countdown: S.countdown(c) });
  }),
);

router.patch(
  '/countdowns/:id',
  validate(z.object({ pinned: z.boolean().optional(), title: text(60).optional(), target: isoDate.optional() })),
  ah(async (req, res) => {
    const r = await prisma.countdown.updateMany({ where: { id: req.params.id, coupleId: req.coupleId }, data: req.valid });
    if (!r.count) throw notFound();
    res.json({ ok: true });
  }),
);

router.delete(
  '/countdowns/:id',
  ah(async (req, res) => {
    await prisma.countdown.deleteMany({ where: { id: req.params.id, coupleId: req.coupleId } });
    res.status(204).end();
  }),
);

export default router;
