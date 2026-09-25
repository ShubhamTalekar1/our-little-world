import { Router } from 'express';
import { prisma } from '../db.js';
import { ah, forbidden, notFound } from '../lib/errors.js';
import { validate, text, clientId, isoDate, z } from '../lib/validate.js';
import { partnerOf } from '../middleware/auth.js';
import { notify } from '../services/notify.js';
import { emitToUser } from '../realtime/hub.js';
import * as S from '../services/serialize.js';

const router = Router();

router.post(
  '/',
  validate(z.object({ id: clientId, title: text(80).pipe(z.string().min(1)), body: text(8000).pipe(z.string().min(1)), unlockAt: isoDate, seal: z.enum(['heart', 'rose', 'moon', 'star']).optional(), paper: z.enum(['cream', 'lavender', 'blush']).optional() })),
  ah(async (req, res) => {
    const l = await prisma.letter.create({ data: { ...req.valid, coupleId: req.coupleId, authorId: req.user.id } });
    const partner = await partnerOf(req.user);
    if (partner) {
      // Sealed letters travel without their contents until they unlock.
      emitToUser(partner.id, 'letter:sent', { from: req.user.id, letter: S.letter(l, partner.id) });
      await notify(partner.id, { type: 'letter', title: 'A letter arrived 💌', body: l.title, link: '/letters' });
    }
    res.status(201).json({ letter: S.letter(l, req.user.id) });
  }),
);

/** Opening returns the full text — but only once it has unlocked. */
router.post(
  '/:id/open',
  ah(async (req, res) => {
    const l = await prisma.letter.findFirst({ where: { id: req.params.id, coupleId: req.coupleId } });
    if (!l) throw notFound();
    if (l.authorId !== req.user.id && l.unlockAt > new Date()) throw forbidden('Not yet — this letter is still sealed');
    const updated = l.authorId === req.user.id || l.openedAt ? l : await prisma.letter.update({ where: { id: l.id }, data: { openedAt: new Date() } });
    res.json({ letter: S.letter(updated, req.user.id) });
  }),
);

export default router;
