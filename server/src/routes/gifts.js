import { Router } from 'express';
import { prisma } from '../db.js';
import { ah, badRequest, notFound } from '../lib/errors.js';
import { validate, text, clientId, z } from '../lib/validate.js';
import { partnerOf } from '../middleware/auth.js';
import { GIFT_PRICES, GIFT_NAMES, MYSTERY_POOL } from '../catalog.js';
import { spend, withTx } from '../services/wallet.js';
import { notify } from '../services/notify.js';
import { emitToUser } from '../realtime/hub.js';
import * as S from '../services/serialize.js';

const router = Router();

router.post(
  '/send',
  validate(z.object({ id: clientId, giftId: z.string().max(30), message: text(200).optional() })),
  ah(async (req, res) => {
    const price = GIFT_PRICES[req.valid.giftId];
    if (price == null) throw badRequest('Unknown gift');
    const partner = await partnerOf(req.user);
    if (!partner) throw badRequest('Your person hasn’t joined yet');
    const gift = await withTx(async (tx) => {
      await spend(tx, req.user.id, price, `Sent ${GIFT_NAMES[req.valid.giftId]}`);
      return tx.gift.create({ data: { id: req.valid.id, coupleId: req.coupleId, senderId: req.user.id, recipientId: partner.id, giftKey: req.valid.giftId, message: req.valid.message ?? '' } });
    });
    // The server — not the sender's client — tells the recipient, so a gift
    // can't be faked without paying for it.
    emitToUser(partner.id, 'gift:received', S.giftReceived(gift));
    await notify(partner.id, { type: 'gift', title: 'Someone sent you something ❤️', body: `${req.user.name} left a little gift for you`, link: '/gifts?tab=collection' });
    res.status(201).json({ gift: S.giftSent(gift) });
  }),
);

router.post(
  '/:id/open',
  validate(z.object({ revealed: z.string().max(30).optional() })),
  ah(async (req, res) => {
    const gift = await prisma.gift.findFirst({ where: { id: req.params.id, recipientId: req.user.id } });
    if (!gift) throw notFound();
    if (gift.openedAt) return res.json({ gift: S.giftReceived(gift) });
    let revealedKey = null;
    if (gift.giftKey === 'mystery') revealedKey = MYSTERY_POOL.includes(req.valid.revealed) ? req.valid.revealed : MYSTERY_POOL[Math.floor(Math.random() * MYSTERY_POOL.length)];
    const updated = await prisma.gift.update({ where: { id: gift.id }, data: { openedAt: new Date(), revealedKey } });
    emitToUser(gift.senderId, 'gift:opened', { id: gift.id, from: req.user.id });
    res.json({ gift: S.giftReceived(updated) });
  }),
);

export default router;
