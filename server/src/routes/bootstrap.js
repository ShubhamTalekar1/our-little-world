import { Router } from 'express';
import { prisma } from '../db.js';
import { ah } from '../lib/errors.js';
import { partnerOf } from '../middleware/auth.js';
import { publicPresence } from '../realtime/presence.js';
import { serializeNotification } from '../services/notify.js';
import { CLOTHING_PRICES } from '../catalog.js';
import * as S from '../services/serialize.js';

const router = Router();

/** Everything a couple's world needs, in one round trip. It's small by design. */
router.get(
  '/',
  ah(async (req, res) => {
    const me = req.user;
    const coupleId = req.coupleId;
    const partner = await partnerOf(me);
    const [couple, avatars, wallet, unlocked, outfits, received, sent, room, pet, messages, memories, letters, events, countdowns, checkins, milestones, achievements, notifications] = await Promise.all([
      prisma.couple.findUnique({ where: { id: coupleId } }),
      prisma.avatar.findMany({ where: { user: { coupleId } } }),
      prisma.wallet.findUnique({ where: { userId: me.id }, include: { transactions: { orderBy: { createdAt: 'desc' }, take: 50 } } }),
      prisma.wardrobeItem.findMany({ where: { userId: me.id } }),
      prisma.outfit.findMany({ where: { userId: me.id }, orderBy: { createdAt: 'desc' } }),
      prisma.gift.findMany({ where: { coupleId, recipientId: me.id }, orderBy: { createdAt: 'desc' } }),
      prisma.gift.findMany({ where: { coupleId, senderId: me.id }, orderBy: { createdAt: 'desc' } }),
      prisma.room.findUnique({ where: { coupleId } }),
      prisma.pet.findUnique({ where: { coupleId } }),
      prisma.message.findMany({ where: { coupleId }, orderBy: { createdAt: 'desc' }, take: 200 }),
      prisma.memory.findMany({ where: { coupleId }, orderBy: { date: 'asc' } }),
      prisma.letter.findMany({ where: { coupleId }, orderBy: { createdAt: 'desc' } }),
      prisma.sharedEvent.findMany({ where: { coupleId }, orderBy: { at: 'asc' } }),
      prisma.countdown.findMany({ where: { coupleId } }),
      prisma.checkIn.findMany({ where: { coupleId }, orderBy: { createdAt: 'desc' }, take: 60 }),
      prisma.milestone.findMany({ where: { coupleId }, orderBy: { date: 'asc' } }),
      prisma.achievement.findMany({ where: { coupleId } }),
      prisma.notification.findMany({ where: { userId: me.id }, orderBy: { createdAt: 'desc' }, take: 60 }),
    ]);

    const msgCount = await prisma.message.count({ where: { coupleId } });
    res.json({
      me: S.person(me, { includeEmail: true }),
      partner: S.person(partner) ?? { id: 'pending', name: 'Your person', pronouns: 'they', timezone: me.timezone },
      couple: S.couple(couple),
      avatars: Object.fromEntries(avatars.map((a) => [a.userId, a.config])),
      wallet: { balance: wallet.balance, lastDailyClaim: wallet.lastDailyClaim, transactions: wallet.transactions.map((t) => ({ id: t.id, amount: t.amount, reason: t.reason, at: t.createdAt })) },
      wardrobe: { unlocked: unlocked.map((u) => u.itemKey).filter((k) => CLOTHING_PRICES[k]), outfits: outfits.map(S.outfit) },
      gifts: { received: received.map(S.giftReceived), sent: sent.map(S.giftSent) },
      room: { environment: room.environment, owned: room.owned, placed: room.placed },
      pet: S.pet(pet),
      messages: messages.reverse().map(S.message),
      memories: memories.map(S.memory),
      letters: letters.map((l) => S.letter(l, me.id)),
      calendar: { events: events.map(S.event), countdowns: countdowns.map(S.countdown) },
      checkins: checkins.map(S.checkin),
      story: {
        milestones: milestones.map(S.milestone),
        stats: { movies: 0, dances: 0, dates: 0, hugs: 0, ...(couple.stats ?? {}), messagesBase: Math.max(0, msgCount - messages.length) },
        unlocked: Object.fromEntries(achievements.map((a) => [a.key, a.unlockedAt])),
      },
      notifications: notifications.map(serializeNotification),
      presence: partner ? await publicPresence(partner.id, partner.lastSeenAt) : null,
    });
  }),
);

export default router;
