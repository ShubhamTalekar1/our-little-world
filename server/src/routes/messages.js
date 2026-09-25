import { Router } from 'express';
import { prisma } from '../db.js';
import { ah, badRequest, notFound } from '../lib/errors.js';
import { validate, text, clientId, z } from '../lib/validate.js';
import { partnerOf } from '../middleware/auth.js';
import { notify } from '../services/notify.js';
import { emitToUser } from '../realtime/hub.js';
import { publicPresence } from '../realtime/presence.js';
import * as S from '../services/serialize.js';

const router = Router();
// Media must come from our own upload endpoint (or be a small inline voice note).
const mediaUrl = z.string().max(700_000).refine((u) => u.startsWith('/api/media/') || /^data:audio\/(webm|ogg|mp4|mpeg);/.test(u), 'Unsupported media');
const EMOJI = text(8).pipe(z.string().min(1));

router.get(
  '/',
  validate(z.object({ before: z.coerce.date().optional(), limit: z.coerce.number().int().min(1).max(200).default(100) }), 'query'),
  ah(async (req, res) => {
    const rows = await prisma.message.findMany({
      where: { coupleId: req.coupleId, ...(req.valid.before ? { createdAt: { lt: req.valid.before } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: req.valid.limit,
    });
    res.json({ messages: rows.reverse().map(S.message) });
  }),
);

router.post(
  '/',
  validate(
    z.object({
      id: clientId,
      type: z.enum(['text', 'image', 'voice', 'sticker', 'gif']),
      text: text(2000).optional(),
      url: mediaUrl.optional(),
      duration: z.number().int().min(0).max(600).optional(),
      stickerId: z.string().max(30).optional(),
    }),
  ),
  ah(async (req, res) => {
    const v = req.valid;
    if (v.type === 'text' && !v.text) throw badRequest('Say something first');
    if ((v.type === 'image' || v.type === 'voice') && !v.url) throw badRequest('Missing media');
    const m = await prisma.message.create({
      data: { id: v.id, coupleId: req.coupleId, senderId: req.user.id, type: v.type, text: v.text, mediaUrl: v.url, duration: v.duration, stickerId: v.stickerId },
    });
    const partner = await partnerOf(req.user);
    if (partner) {
      emitToUser(partner.id, 'chat:message', { from: req.user.id, message: S.message(m) });
      // Only leave a notification if they're not around to see it arrive.
      const p = await publicPresence(partner.id);
      if (p.status === 'offline') await notify(partner.id, { type: 'message', title: `${req.user.name}: ${v.text?.slice(0, 80) ?? (v.type === 'image' ? '📷 Photo' : v.type === 'voice' ? '🎙️ Voice note' : '✨ Sticker')}`, link: '/chat' });
    }
    res.status(201).json({ message: S.message(m) });
  }),
);

router.post(
  '/:id/react',
  validate(z.object({ emoji: EMOJI })),
  ah(async (req, res) => {
    const m = await prisma.message.findFirst({ where: { id: req.params.id, coupleId: req.coupleId } });
    if (!m) throw notFound();
    const reactions = { ...(m.reactions ?? {}) };
    if (reactions[req.user.id] === req.valid.emoji) delete reactions[req.user.id];
    else reactions[req.user.id] = req.valid.emoji;
    await prisma.message.update({ where: { id: m.id }, data: { reactions } });
    res.json({ reactions });
  }),
);

export default router;
