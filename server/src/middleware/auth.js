import { prisma } from '../db.js';
import { tokenFrom, verifyToken } from '../lib/auth.js';
import { unauthorized, forbidden } from '../lib/errors.js';

/** Authenticate and load the user + their couple membership. */
export async function requireAuth(req, _res, next) {
  try {
    const token = tokenFrom(req);
    if (!token) throw unauthorized();
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw unauthorized('Your session expired');
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.tokenVersion !== payload.v) throw unauthorized();
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}

/**
 * Every private resource belongs to a couple. This guarantees a user can only
 * ever touch their own couple's data: handlers use req.coupleId in every query.
 */
export function requireCouple(req, _res, next) {
  if (!req.user?.coupleId) return next(forbidden('Join or create your world first'));
  req.coupleId = req.user.coupleId;
  next();
}

export async function partnerOf(user) {
  if (!user.coupleId) return null;
  return prisma.user.findFirst({ where: { coupleId: user.coupleId, NOT: { id: user.id } } });
}
