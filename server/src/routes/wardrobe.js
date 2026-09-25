import { Router } from 'express';
import { prisma } from '../db.js';
import { ah, notFound } from '../lib/errors.js';
import { validate, text, clientId, z } from '../lib/validate.js';
import { CLOTHING_PRICES } from '../catalog.js';
import { spend, withTx } from '../services/wallet.js';
import * as S from '../services/serialize.js';

const router = Router();
const key = z.string().regex(/^[a-z0-9-]{1,40}$/);
const items = z.record(key, key.nullable().optional());

router.post(
  '/unlock',
  validate(z.object({ itemId: key })),
  ah(async (req, res) => {
    const price = CLOTHING_PRICES[req.valid.itemId] ?? 0;
    await withTx(async (tx) => {
      const owned = await tx.wardrobeItem.findUnique({ where: { userId_itemKey: { userId: req.user.id, itemKey: req.valid.itemId } } });
      if (owned) return;
      await spend(tx, req.user.id, price, `Unlocked ${req.valid.itemId}`);
      await tx.wardrobeItem.create({ data: { userId: req.user.id, itemKey: req.valid.itemId } });
    });
    res.status(201).json({ ok: true });
  }),
);

router.post(
  '/outfits',
  validate(z.object({ id: clientId, name: text(40).pipe(z.string().min(1)), emoji: text(8).optional(), favorite: z.boolean().optional(), items })),
  ah(async (req, res) => {
    const o = await prisma.outfit.create({ data: { ...req.valid, userId: req.user.id } });
    res.status(201).json({ outfit: S.outfit(o) });
  }),
);

router.patch(
  '/outfits/:id',
  validate(z.object({ name: text(40).pipe(z.string().min(1)).optional(), favorite: z.boolean().optional(), items: items.optional(), emoji: text(8).optional() })),
  ah(async (req, res) => {
    const r = await prisma.outfit.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: req.valid });
    if (!r.count) throw notFound();
    res.json({ ok: true });
  }),
);

router.delete(
  '/outfits/:id',
  ah(async (req, res) => {
    await prisma.outfit.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
    res.status(204).end();
  }),
);

export default router;
