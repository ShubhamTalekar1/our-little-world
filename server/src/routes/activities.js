import { Router } from 'express';
import { prisma } from '../db.js';
import { ah, notFound } from '../lib/errors.js';
import { validate, text, clientId, isoDate, z } from '../lib/validate.js';
import { STAT_KEYS } from '../catalog.js';
import { earn, withTx } from '../services/wallet.js';
import * as S from '../services/serialize.js';

const router = Router();
// Shared moments that also leave a trace in the Activity history + reward coins.
const SESSION_TYPES = { movies: { type: 'movie', reward: 20, reason: 'Movie night together' }, dances: { type: 'dance', reward: 30, reason: 'A slow dance' }, dates: { type: 'date', reward: 40, reason: 'Date night' } };

router.post(
  '/stats',
  validate(z.object({ key: z.enum(STAT_KEYS), by: z.literal(1).default(1) })),
  ah(async (req, res) => {
    const stats = await withTx(async (tx) => {
      const couple = await tx.couple.findUnique({ where: { id: req.coupleId } });
      const next = { ...(couple.stats ?? {}), [req.valid.key]: ((couple.stats ?? {})[req.valid.key] ?? 0) + 1 };
      await tx.couple.update({ where: { id: req.coupleId }, data: { stats: next } });
      const session = SESSION_TYPES[req.valid.key];
      if (session) {
        await tx.activity.create({ data: { coupleId: req.coupleId, type: session.type, participants: { create: { userId: req.user.id } } } });
        await earn(tx, req.user.id, session.reward, session.reason);
      }
      return next;
    });
    res.json({ stats });
  }),
);

router.get(
  '/history',
  ah(async (req, res) => {
    const rows = await prisma.activity.findMany({ where: { coupleId: req.coupleId }, orderBy: { startedAt: 'desc' }, take: 50, include: { participants: true } });
    res.json({ activities: rows.map((a) => ({ id: a.id, type: a.type, startedAt: a.startedAt, endedAt: a.endedAt, participants: a.participants.map((p) => p.userId) })) });
  }),
);

router.post(
  '/milestones',
  validate(z.object({ id: clientId, emoji: text(8).optional(), title: text(80).pipe(z.string().min(1)), note: text(240).optional(), date: isoDate, kind: z.enum(['manual', 'auto']).optional(), autoKey: z.string().max(40).optional() })),
  ah(async (req, res) => {
    const data = { ...req.valid, coupleId: req.coupleId };
    // Auto "firsts" are recorded once per couple, whoever gets there first.
    const m = data.autoKey
      ? await prisma.milestone.upsert({ where: { coupleId_autoKey: { coupleId: req.coupleId, autoKey: data.autoKey } }, create: data, update: {} })
      : await prisma.milestone.create({ data });
    res.status(201).json({ milestone: S.milestone(m) });
  }),
);

router.delete(
  '/milestones/:id',
  ah(async (req, res) => {
    const r = await prisma.milestone.deleteMany({ where: { id: req.params.id, coupleId: req.coupleId, kind: 'manual' } });
    if (!r.count) throw notFound();
    res.status(204).end();
  }),
);

export default router;
