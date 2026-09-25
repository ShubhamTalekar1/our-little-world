import { Router } from 'express';
import { prisma } from '../db.js';
import { ah, badRequest } from '../lib/errors.js';
import { validate, text, z } from '../lib/validate.js';
import { ENVIRONMENTS, FURNITURE_KEYS, PET_ACCESSORIES, PET_FOOD } from '../catalog.js';
import * as S from '../services/serialize.js';

const router = Router();
const clamp = (n) => Math.max(0, Math.min(100, n));

const placedItem = z.object({ uid: z.string().max(40), id: z.enum(FURNITURE_KEYS), x: z.number().min(0).max(100), y: z.number().min(0).max(100) });

router.put(
  '/current',
  validate(z.object({ environment: z.enum(ENVIRONMENTS).optional(), placed: z.array(placedItem).max(60).optional() })),
  ah(async (req, res) => {
    const updated = await prisma.room.update({ where: { coupleId: req.coupleId }, data: req.valid });
    res.json({ room: { environment: updated.environment, placed: updated.placed } });
  }),
);

// Stats decay with time; compute on read/write so there's no background job.
function decayed(p) {
  const hours = (Date.now() - p.lastTick.getTime()) / 3_600_000;
  return { hunger: clamp(p.hunger - hours * 3), happiness: clamp(p.happiness - hours * 2), lastTick: new Date() };
}

router.put(
  '/pet',
  validate(z.object({ adopted: z.boolean().optional(), species: z.enum(['cat', 'dog', 'bunny', 'fox', 'dragon']).optional(), name: text(24).optional(), accessory: z.enum(PET_ACCESSORIES).optional() })),
  ah(async (req, res) => {
    const pet = await prisma.pet.findUnique({ where: { coupleId: req.coupleId } });
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
    const p = await prisma.pet.findUnique({ where: { coupleId: req.coupleId } });
    if (!p.adopted) throw badRequest('Adopt a companion first');
    const d = decayed(p);
    const pet = await prisma.pet.update({ where: { coupleId: req.coupleId }, data: { ...d, hunger: clamp(d.hunger + PET_FOOD[req.valid.food]), happiness: clamp(d.happiness + 4) } });
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

export default router;
