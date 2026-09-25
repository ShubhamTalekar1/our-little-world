import { prisma } from '../db.js';
import { badRequest } from '../lib/errors.js';

/**
 * Atomic spend: the balance check and decrement happen in one conditional
 * update, so two concurrent purchases can never overdraw a wallet.
 */
export async function spend(tx, userId, amount, reason) {
  if (amount <= 0) return;
  const res = await tx.wallet.updateMany({ where: { userId, balance: { gte: amount } }, data: { balance: { decrement: amount } } });
  if (res.count === 0) throw badRequest('Not enough Love Coins');
  await tx.transaction.create({ data: { walletId: userId, amount: -amount, reason } });
}

export async function earn(tx, userId, amount, reason) {
  await tx.wallet.update({ where: { userId }, data: { balance: { increment: amount } } });
  await tx.transaction.create({ data: { walletId: userId, amount, reason } });
}

export const withTx = (fn) => prisma.$transaction(fn);
