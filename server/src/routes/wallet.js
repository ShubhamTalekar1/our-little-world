import { Router } from 'express';
import { prisma } from '../db.js';
import { ah, badRequest } from '../lib/errors.js';
import { validate, z } from '../lib/validate.js';
import { earn, withTx } from '../services/wallet.js';
import { paymentProvider } from '../services/payments.js';
import { config } from '../config.js';

const router = Router();

router.get(
  '/',
  ah(async (req, res) => {
    const w = await prisma.wallet.findUnique({ where: { userId: req.user.id }, include: { transactions: { orderBy: { createdAt: 'desc' }, take: 50 } } });
    res.json({ balance: w.balance, lastDailyClaim: w.lastDailyClaim, transactions: w.transactions.map((t) => ({ id: t.id, amount: t.amount, reason: t.reason, at: t.createdAt })) });
  }),
);

router.post(
  '/daily',
  ah(async (req, res) => {
    const balance = await withTx(async (tx) => {
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      // Conditional update = no double claims even with two tabs open.
      const r = await tx.wallet.updateMany({
        where: { userId: req.user.id, OR: [{ lastDailyClaim: null }, { lastDailyClaim: { lt: startOfDay } }] },
        data: { lastDailyClaim: new Date() },
      });
      if (!r.count) throw badRequest('Already said hello today ✨');
      await earn(tx, req.user.id, config.dailyReward, 'Daily hello');
      return (await tx.wallet.findUnique({ where: { userId: req.user.id } })).balance;
    });
    res.json({ balance });
  }),
);

router.post(
  '/topup',
  validate(z.object({ packId: z.string().max(20) })),
  ah(async (req, res) => {
    const { coins } = await paymentProvider.topUp(req.valid.packId);
    const balance = await withTx(async (tx) => {
      await earn(tx, req.user.id, coins, `Top-up (${req.valid.packId})`);
      return (await tx.wallet.findUnique({ where: { userId: req.user.id } })).balance;
    });
    res.json({ coins, balance });
  }),
);

export default router;
