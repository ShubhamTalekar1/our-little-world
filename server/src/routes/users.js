import { Router } from 'express';
import { prisma } from '../db.js';
import { ah } from '../lib/errors.js';
import { validate, text, clientId, isoDate, z } from '../lib/validate.js';
import { partnerOf } from '../middleware/auth.js';
import { earn } from '../services/wallet.js';
import { notify } from '../services/notify.js';
import { emitToUser } from '../realtime/hub.js';
import * as S from '../services/serialize.js';

const router = Router();
const MOODS = ['happy', 'loved', 'tired', 'sad', 'excited', 'meh'];
const MOOD_LABEL = { happy: '😊 Happy', loved: '🥰 Loved', tired: '😴 Tired', sad: '😔 Sad', excited: '😎 Excited', meh: '😐 Meh' };

router.patch(
  '/me',
  validate(z.object({ name: text(40).pipe(z.string().min(1)).optional(), timezone: z.string().max(60).optional(), pronouns: z.enum(['she', 'he', 'they']).optional() })),
  ah(async (req, res) => {
    const user = await prisma.user.update({ where: { id: req.user.id }, data: req.valid });
    res.json({ user: S.person(user, { includeEmail: true }) });
  }),
);

router.get(
  '/partner',
  ah(async (req, res) => res.json({ partner: S.person(await partnerOf(req.user)) })),
);

router.patch(
  '/couple',
  validate(z.object({ since: isoDate.optional(), anniversary: isoDate.optional(), name: text(60).optional() })),
  ah(async (req, res) => {
    const couple = await prisma.couple.update({ where: { id: req.coupleId }, data: req.valid });
    res.json({ couple: S.couple(couple) });
  }),
);

function dayIn(tz) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

router.post(
  '/checkins',
  validate(z.object({ id: clientId, mood: z.enum(MOODS), note: text(200).optional() })),
  ah(async (req, res) => {
    const day = dayIn(req.user.timezone);
    const existing = await prisma.checkIn.findUnique({ where: { userId_day: { userId: req.user.id, day } } });
    const c = await prisma.$transaction(async (tx) => {
      const row = await tx.checkIn.upsert({
        where: { userId_day: { userId: req.user.id, day } },
        create: { id: req.valid.id, coupleId: req.coupleId, userId: req.user.id, day, mood: req.valid.mood, note: req.valid.note ?? '' },
        update: { mood: req.valid.mood, note: req.valid.note ?? '' },
      });
      if (!existing) await earn(tx, req.user.id, 25, 'Daily check-in');
      return row;
    });
    const partner = await partnerOf(req.user);
    if (partner) {
      emitToUser(partner.id, 'checkin:new', { from: req.user.id, checkin: S.checkin(c) });
      await notify(partner.id, { type: 'checkin', title: `${req.user.name} is feeling ${MOOD_LABEL[c.mood]} today`, body: c.note, link: '/dates' });
    }
    res.status(201).json({ checkin: S.checkin(c) });
  }),
);

export default router;
