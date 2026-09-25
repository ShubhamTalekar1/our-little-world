// DB rows → the shapes the client stores use.
export const person = (u, { includeEmail = false } = {}) =>
  u && { id: u.id, name: u.name, pronouns: u.pronouns, timezone: u.timezone, ...(includeEmail ? { email: u.email } : {}) };

export const couple = (c) => c && { id: c.id, name: c.name, since: c.since, anniversary: c.anniversary ?? c.since, inviteCode: c.inviteCode, inviteUsed: !!c.inviteUsedAt };

export const message = (m) => ({
  id: m.id,
  from: m.senderId,
  type: m.type,
  text: m.text ?? undefined,
  url: m.mediaUrl ?? undefined,
  duration: m.duration ?? undefined,
  stickerId: m.stickerId ?? undefined,
  reactions: m.reactions ?? {},
  readAt: m.readAt,
  at: m.createdAt,
});

export const giftReceived = (g) => ({ id: g.id, giftId: g.giftKey, from: g.senderId, message: g.message, at: g.createdAt, opened: !!g.openedAt, revealed: g.revealedKey ?? undefined });
export const giftSent = (g) => ({ id: g.id, giftId: g.giftKey, to: g.recipientId, message: g.message, at: g.createdAt });

export const memory = (m) => ({ id: m.id, image: m.image, scene: m.scene, caption: m.caption, location: m.location, date: m.date, reactions: m.reactions ?? {}, rotation: m.rotation, by: m.authorId });

/** Locked letters keep their contents on the server until they unlock. */
export const letter = (l, viewerId, now = new Date()) => {
  const sealed = l.authorId !== viewerId && l.unlockAt > now;
  return { id: l.id, from: l.authorId, title: l.title, body: sealed ? '' : l.body, sealed, unlockAt: l.unlockAt, at: l.createdAt, openedAt: l.openedAt, seal: l.seal, paper: l.paper };
};

export const event = (e) => ({ id: e.id, title: e.title, emoji: e.emoji, type: e.type, at: e.at, reminder: e.reminder, note: e.note });
export const countdown = (c) => ({ id: c.id, title: c.title, emoji: c.emoji, target: c.target, accent: c.accent, pinned: c.pinned });
export const checkin = (c) => ({ id: c.id, userId: c.userId, mood: c.mood, note: c.note, at: c.createdAt });
export const milestone = (m) => ({ id: m.id, emoji: m.emoji, title: m.title, note: m.note, date: m.date, kind: m.kind, autoKey: m.autoKey ?? undefined });
export const outfit = (o) => ({ id: o.id, name: o.name, emoji: o.emoji, favorite: o.favorite, items: o.items });
export const pet = (p) =>
  p
    ? { adopted: p.adopted, species: p.species, name: p.name, accessory: p.accessory, hunger: p.hunger, happiness: p.happiness, lastTick: p.lastTick, ownedAccessories: p.ownedAccessories, log: [] }
    : { adopted: false, ownedAccessories: ['none', 'bow'], log: [] };
