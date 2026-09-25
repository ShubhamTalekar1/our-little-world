import { Router } from 'express';
import { prisma } from '../db.js';
import { ah, badRequest } from '../lib/errors.js';
import { validate, z } from '../lib/validate.js';

const router = Router();

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const key = z.string().regex(/^[a-z0-9-]{1,40}$/);
const avatarSchema = z.object({
  presentation: z.enum(['feminine', 'masculine']).optional(),
  skin: hex,
  bodyType: key,
  height: key,
  faceShape: key,
  hair: z.object({ style: key, color: hex }),
  face: z.object({ eyes: key, eyeColor: hex, brows: key, nose: key, mouth: key, extra: key }),
  outfit: z.record(key, key.nullable().optional()),
});

router.get(
  '/',
  ah(async (req, res) => {
    const rows = await prisma.avatar.findMany({ where: { user: { coupleId: req.coupleId } } });
    res.json({ avatars: Object.fromEntries(rows.map((r) => [r.userId, r.config])) });
  }),
);

router.put(
  '/me',
  validate(z.object({ config: avatarSchema })),
  ah(async (req, res) => {
    const config = req.valid.config;
    if (JSON.stringify(config).length > 4000) throw badRequest('Avatar is too large');
    const row = await prisma.avatar.upsert({ where: { userId: req.user.id }, create: { userId: req.user.id, config }, update: { config } });
    res.json({ avatar: row.config });
  }),
);

export default router;
