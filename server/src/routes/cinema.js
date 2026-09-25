import { Router } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../db.js';
import { ah, notFound, forbidden, badRequest } from '../lib/errors.js';
import { validate, text, clientId, isoDate, z } from '../lib/validate.js';
import { partnerOf } from '../middleware/auth.js';
import { notify } from '../services/notify.js';
import { emitToUser } from '../realtime/hub.js';

const router = Router();

// Films that are always showing (keep in sync with client/src/catalog/videos.js).
const HOUSE_FILMS = {
  'film:bbb': { title: 'Big Buck Bunny', palette: 2 },
  'film:sintel': { title: 'Sintel', palette: 5 },
};
// Two seats side by side, in the good row.
const SEATS = ['F7', 'F8'];
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const ticketCode = () => `ADMIT-${[...crypto.randomBytes(6)].map((b) => ALPHABET[b % ALPHABET.length]).join('')}`;

const poster = z.string().max(300).refine((u) => u.startsWith('/api/media/'), 'Upload the poster first');

export const serializeShowing = (s) => ({
  id: s.id,
  title: s.title,
  tagline: s.tagline,
  genre: s.genre,
  poster: s.poster,
  palette: s.palette,
  kind: s.kind,
  source: s.source,
  startsAt: s.startsAt,
  hostId: s.createdById,
  createdAt: s.createdAt,
});
export const serializeTicket = (t) => ({
  id: t.id,
  userId: t.userId,
  showingKey: t.showingKey,
  title: t.title,
  poster: t.poster,
  palette: t.palette,
  seat: t.seat,
  code: t.code,
  createdAt: t.createdAt,
  usedAt: t.usedAt,
});

router.get(
  '/showings',
  ah(async (req, res) => {
    const rows = await prisma.showing.findMany({ where: { coupleId: req.coupleId }, orderBy: { createdAt: 'desc' }, take: 60 });
    res.json({ showings: rows.map(serializeShowing) });
  }),
);

const showingSchema = z
  .object({
    id: clientId,
    title: text(60).pipe(z.string().min(1)),
    tagline: text(120).optional(),
    genre: text(30).optional(),
    poster: poster.nullable().optional(),
    palette: z.number().int().min(0).max(11).optional(),
    kind: z.enum(['stream', 'youtube', 'link']),
    source: z.string().max(500).nullable().optional(),
    startsAt: isoDate.nullable().optional(),
  })
  .refine((v) => v.kind === 'stream' || !!v.source, { message: 'Add a link for this film', path: ['source'] })
  .refine((v) => v.kind !== 'link' || /^https:\/\/\S+$/i.test(v.source ?? ''), { message: 'Links must start with https://', path: ['source'] })
  .refine((v) => v.kind !== 'youtube' || /^[\w-]{11}$/.test(v.source ?? ''), { message: 'That YouTube link doesn’t look right', path: ['source'] });

router.post(
  '/showings',
  validate(showingSchema),
  ah(async (req, res) => {
    const v = req.valid;
    const s = await prisma.showing.create({
      data: {
        id: v.id,
        coupleId: req.coupleId,
        createdById: req.user.id,
        title: v.title,
        tagline: v.tagline ?? '',
        genre: v.genre ?? '',
        poster: v.poster ?? null,
        palette: v.palette ?? 0,
        kind: v.kind,
        source: v.kind === 'stream' ? null : v.source,
        startsAt: v.startsAt ?? null,
      },
    });
    const partner = await partnerOf(req.user);
    if (partner) {
      emitToUser(partner.id, 'showing:new', { from: req.user.id, showing: serializeShowing(s) });
      await notify(partner.id, { type: 'activity', title: `Now showing: ${s.title} 🎬`, body: s.tagline, link: '/together/movie' });
    }
    res.status(201).json({ showing: serializeShowing(s) });
  }),
);

router.delete(
  '/showings/:id',
  ah(async (req, res) => {
    const s = await prisma.showing.findFirst({ where: { id: req.params.id, coupleId: req.coupleId } });
    if (!s) throw notFound();
    if (s.createdById !== req.user.id) throw forbidden('Only whoever added this film can take it down');
    await prisma.showing.delete({ where: { id: s.id } });
    const partner = await partnerOf(req.user);
    if (partner) emitToUser(partner.id, 'showing:removed', { from: req.user.id, id: s.id });
    res.status(204).end();
  }),
);

router.get(
  '/tickets',
  ah(async (req, res) => {
    const rows = await prisma.ticket.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 100 });
    res.json({ tickets: rows.map(serializeTicket) });
  }),
);

router.post(
  '/tickets',
  validate(z.object({ showingKey: z.string().min(1).max(40) })),
  ah(async (req, res) => {
    const key = req.valid.showingKey;
    const existing = await prisma.ticket.findUnique({ where: { userId_showingKey: { userId: req.user.id, showingKey: key } } });
    if (existing) return res.json({ ticket: serializeTicket(existing) });

    let film = HOUSE_FILMS[key];
    if (!film) {
      const s = await prisma.showing.findFirst({ where: { id: key, coupleId: req.coupleId } });
      if (!s) throw badRequest('That film isn’t showing anymore');
      film = { title: s.title, poster: s.poster, palette: s.palette };
    }
    // Sit next to whoever already has a ticket for this film.
    const taken = await prisma.ticket.findMany({ where: { coupleId: req.coupleId, showingKey: key }, select: { seat: true } });
    const seat = SEATS.find((s) => !taken.some((t) => t.seat === s)) ?? SEATS[1];
    const t = await prisma.ticket.create({
      data: { coupleId: req.coupleId, userId: req.user.id, showingKey: key, title: film.title, poster: film.poster ?? null, palette: film.palette ?? 0, seat, code: ticketCode() },
    });
    const partner = await partnerOf(req.user);
    if (partner) emitToUser(partner.id, 'ticket:partner', { from: req.user.id, showingKey: key, title: t.title, seat: t.seat });
    res.status(201).json({ ticket: serializeTicket(t) });
  }),
);

router.post(
  '/tickets/:id/check-in',
  ah(async (req, res) => {
    const t = await prisma.ticket.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!t) throw notFound();
    const updated = t.usedAt ? t : await prisma.ticket.update({ where: { id: t.id }, data: { usedAt: new Date() } });
    res.json({ ticket: serializeTicket(updated) });
  }),
);

export default router;
