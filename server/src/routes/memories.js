import { Router } from 'express';
import { prisma } from '../db.js';
import { ah, notFound } from '../lib/errors.js';
import { validate, text, clientId, isoDate, z } from '../lib/validate.js';
import { partnerOf } from '../middleware/auth.js';
import { notify } from '../services/notify.js';
import { emitToUser } from '../realtime/hub.js';
import * as S from '../services/serialize.js';

const router = Router();
const SCENES = ['sunset', 'rain', 'city', 'cafe', 'stars', 'flowers', 'beach', 'film', 'cake'];
const image = z.string().max(300).refine((u) => u.startsWith('/api/media/'), 'Upload the photo first');

router.post(
  '/',
  validate(z.object({ id: clientId, image: image.nullable().optional(), scene: z.enum(SCENES).nullable().optional(), caption: text(140).pipe(z.string().min(1)), location: text(60).optional(), date: isoDate, rotation: z.number().min(-10).max(10).optional() })),
  ah(async (req, res) => {
    const m = await prisma.memory.create({ data: { ...req.valid, coupleId: req.coupleId, authorId: req.user.id, image: req.valid.image ?? null, scene: req.valid.image ? null : req.valid.scene ?? 'sunset' } });
    const partner = await partnerOf(req.user);
    if (partner) {
      emitToUser(partner.id, 'memory:added', { from: req.user.id, memory: S.memory(m) });
      await notify(partner.id, { type: 'memory', title: 'New memory on the wall 📸', body: m.caption, link: '/memories' });
    }
    res.status(201).json({ memory: S.memory(m) });
  }),
);

router.patch(
  '/:id',
  validate(z.object({ caption: text(140).pipe(z.string().min(1)).optional(), location: text(60).optional(), date: isoDate.optional() })),
  ah(async (req, res) => {
    const r = await prisma.memory.updateMany({ where: { id: req.params.id, coupleId: req.coupleId }, data: req.valid });
    if (!r.count) throw notFound();
    res.json({ ok: true });
  }),
);

router.delete(
  '/:id',
  ah(async (req, res) => {
    await prisma.memory.deleteMany({ where: { id: req.params.id, coupleId: req.coupleId } });
    res.status(204).end();
  }),
);

router.post(
  '/:id/react',
  validate(z.object({ emoji: text(8).pipe(z.string().min(1)) })),
  ah(async (req, res) => {
    const m = await prisma.memory.findFirst({ where: { id: req.params.id, coupleId: req.coupleId } });
    if (!m) throw notFound();
    const reactions = { ...(m.reactions ?? {}) };
    if (reactions[req.user.id] === req.valid.emoji) delete reactions[req.user.id];
    else reactions[req.user.id] = req.valid.emoji;
    await prisma.memory.update({ where: { id: m.id }, data: { reactions } });
    res.json({ reactions });
  }),
);

export default router;
