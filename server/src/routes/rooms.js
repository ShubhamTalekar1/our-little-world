import { Router } from 'express';
import { prisma } from '../db.js';
import { ah, badRequest } from '../lib/errors.js';
import { validate, text, z } from '../lib/validate.js';
import { ENVIRONMENTS, FURNITURE_PRICES, PET_ACCESSORY_PRICES, PET_FOOD } from '../catalog.js';
import { spend, withTx } from '../services/wallet.js';
import * as S from '../services/serialize.js';

const router = Router();
const clamp = (n) => Math.max(0, Math.min(100, n));

const placedItem = z.object({ uid: z.string().max(40), id: z.string().max(30), x: z.number().min(0).max(100), y: z.number().min(0).max(100) });

router.put(
  '/current',
  validate(z.object({ environment: z.enum(ENVIRONMENTS).optional(), placed: z.array(placedItem).max(60).optional() })),
  ah(async (req, res) => {
    const room = await prisma.room.findUnique({ where: { coupleId: req.coupleId } });
    // Only furniture the couple owns can be placed.
    const placed = req.valid.placed?.filter((p) => room.owned.includes(p.id));
    const updated = await prisma.room.update({ where: { coupleId: req.coupleId }, data: { environment: req.valid.environment, placed } });
    res.json({ room: { environment: updated.environment, owned: updated.owned, placed: updated.placed } });
  }),
);

router.post(
  '/furniture',
  validate(z.object({ itemId: z.string().max(30) })),
  ah(async (req, res) => {
    const price = FURNITURE_PRICES[req.valid.itemId];
    if (price == null) throw badRequest('Unknown item');
    const room = await withTx(async (tx) => {
      const r = await tx.room.findUnique({ where: { coupleId: req.coupleId } });
      if (r.owned.includes(req.valid.itemId)) return r;
      await spend(tx, req.user.id, price, `Bought ${req.valid.itemId}`);
      return tx.room.update({ where: { coupleId: req.coupleId }, data: { owned: { push: req.valid.itemId } } });
    });
    res.status(201).json({ owned: room.owned });
  }),
);

// Stats decay with time; compute on read/write so there's no background job.
function decayed(p) {
  const hours = (Date.now() - p.lastTick.getTime()) / 3_600_000;
  return { hunger: clamp(p.hunger - hours * 3), happiness: clamp(p.happiness - hours * 2), lastTick: new Date() };
}

router.put(
  '/pet',
  validate(z.object({ adopted: z.boolean().optional(), species: z.enum(['cat', 'dog', 'bunny', 'fox', 'dragon']).optional(), name: text(24).optional(), accessory: z.string().max(20).optional() })),
  ah(async (req, res) => {
    const pet = await prisma.pet.findUnique({ where: { coupleId: req.coupleId } });
    if (req.valid.accessory && !pet.ownedAccessories.includes(req.valid.accessory)) throw badRequest('Buy that first');
    const data = { ...req.valid };
    if (data.adopted && !pet.adopted) Object.assign(data, { hunger: 80, happiness: 90, lastTick: new Date(), name: data.name || 'Mochi' });
    const updated = await prisma.pet.update({ where: { coupleId: req.coupleId }, data });
    res.json({ pet: S.pet(updated) });
  }),
);

router.post(
  '/pet/feed',
  validate(z.object({ food: z.enum(Object.keys(PET_FOOD)) })),
  ah(async (req, res) => {
    const food = PET_FOOD[req.valid.food];
    const pet = await withTx(async (tx) => {
      const p = await tx.pet.findUnique({ where: { coupleId: req.coupleId } });
      if (!p.adopted) throw badRequest('Adopt a companion first');
      await spend(tx, req.user.id, food.price, `${req.valid.food} for ${p.name}`);
      const d = decayed(p);
      return tx.pet.update({ where: { coupleId: req.coupleId }, data: { ...d, hunger: clamp(d.hunger + food.hunger), happiness: clamp(d.happiness + 4) } });
    });
    res.json({ pet: S.pet(pet) });
  }),
);

router.post(
  '/pet/play',
  ah(async (req, res) => {
    const p = await prisma.pet.findUnique({ where: { coupleId: req.coupleId } });
    const d = decayed(p);
    const pet = await prisma.pet.update({ where: { coupleId: req.coupleId }, data: { ...d, happiness: clamp(d.happiness + 12), hunger: clamp(d.hunger - 3) } });
    res.json({ pet: S.pet(pet) });
  }),
);

router.post(
  '/pet/accessory',
  validate(z.object({ id: z.enum(Object.keys(PET_ACCESSORY_PRICES)) })),
  ah(async (req, res) => {
    const pet = await withTx(async (tx) => {
      const p = await tx.pet.findUnique({ where: { coupleId: req.coupleId } });
      if (p.ownedAccessories.includes(req.valid.id)) return tx.pet.update({ where: { coupleId: req.coupleId }, data: { accessory: req.valid.id } });
      await spend(tx, req.user.id, PET_ACCESSORY_PRICES[req.valid.id], `${req.valid.id} for ${p.name}`);
      return tx.pet.update({ where: { coupleId: req.coupleId }, data: { ownedAccessories: { push: req.valid.id }, accessory: req.valid.id } });
    });
    res.json({ pet: S.pet(pet) });
  }),
);

export default router;
