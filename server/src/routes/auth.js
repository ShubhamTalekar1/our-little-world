import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';
import { prisma } from '../db.js';
import { ah, badRequest, unauthorized, conflict } from '../lib/errors.js';
import { validate, text, z } from '../lib/validate.js';
import { hashPassword, checkPassword, signToken, COOKIE, cookieOptions } from '../lib/auth.js';
import { requireAuth } from '../middleware/auth.js';
import * as S from '../services/serialize.js';

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60_000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many attempts — take a breath and try again soon' } });

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const inviteCode = () => `LOVE-${[...crypto.randomBytes(4)].map((b) => ALPHABET[b % ALPHABET.length]).join('')}`;

const registerSchema = z.object({
  name: text(40).pipe(z.string().min(1)),
  email: z.string().email().max(200).transform((s) => s.toLowerCase()),
  password: z.string().min(8).max(200),
  inviteCode: z.string().max(20).optional(),
  timezone: z.string().max(60).optional(),
});

router.post(
  '/register',
  limiter,
  validate(registerSchema),
  ah(async (req, res) => {
    const { name, email, password, timezone } = req.valid;
    if (await prisma.user.findUnique({ where: { email } })) throw conflict('That email already has a world');
    const passwordHash = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      let couple;
      if (req.valid.inviteCode) {
        const code = req.valid.inviteCode.toUpperCase().trim();
        couple = await tx.couple.findUnique({ where: { inviteCode: code }, include: { users: true } });
        // A world holds exactly two people. Codes are single-use.
        if (!couple || couple.inviteUsedAt || couple.users.length >= 2) throw badRequest('That invite code isn’t valid anymore');
        await tx.couple.update({ where: { id: couple.id }, data: { inviteUsedAt: new Date() } });
      } else {
        couple = await tx.couple.create({ data: { inviteCode: inviteCode(), room: { create: {} }, pet: { create: {} } } });
      }
      const user = await tx.user.create({
        data: { name, email, passwordHash, timezone: timezone ?? 'UTC', coupleId: couple.id },
      });
      return { user, couple };
    });

    const token = signToken(result.user);
    res.cookie(COOKIE, token, cookieOptions);
    res.status(201).json({ token, user: S.person(result.user, { includeEmail: true }), couple: S.couple(result.couple) });
  }),
);

router.post(
  '/login',
  limiter,
  validate(z.object({ email: z.string().email().transform((s) => s.toLowerCase()), password: z.string().min(1).max(200) })),
  ah(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { email: req.valid.email } });
    // Same message either way: don't reveal which emails exist.
    if (!user || !(await checkPassword(req.valid.password, user.passwordHash))) throw unauthorized('That email and password don’t match');
    const token = signToken(user);
    res.cookie(COOKIE, token, cookieOptions);
    res.json({ token, user: S.person(user, { includeEmail: true }) });
  }),
);

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE, { ...cookieOptions, maxAge: undefined });
  res.status(204).end();
});

/** Invalidate every session (e.g. a lost phone). */
router.post(
  '/logout-all',
  requireAuth,
  ah(async (req, res) => {
    await prisma.user.update({ where: { id: req.user.id }, data: { tokenVersion: { increment: 1 } } });
    res.clearCookie(COOKIE, { ...cookieOptions, maxAge: undefined });
    res.status(204).end();
  }),
);

router.get('/me', requireAuth, (req, res) => res.json({ user: S.person(req.user, { includeEmail: true }) }));

export default router;
