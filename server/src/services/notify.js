import { prisma } from '../db.js';
import { emitToUser } from '../realtime/hub.js';

/** Store a notification for someone and nudge their open sessions. */
export async function notify(userId, { type, title, body = '', link = null }) {
  if (!userId) return null;
  const n = await prisma.notification.create({ data: { userId, type, title: title.slice(0, 160), body: body.slice(0, 300), link } });
  emitToUser(userId, 'notification:new', serializeNotification(n));
  return n;
}

export const serializeNotification = (n) => ({ id: n.id, type: n.type, title: n.title, body: n.body, link: n.link, read: n.read, at: n.createdAt });
