import { DEMO_MODE } from '../../config/env';
import { api } from '../api/client';

/**
 * Wallet top-ups. No real money moves anywhere in this app yet.
 * - mockProvider: instantly grants coins (demo / development).
 * - serverProvider: asks the API, which today also grants from a free
 *   allowance; a Stripe Checkout session would slot in server-side there
 *   (see server/src/services/payments.js). Card details never touch this app.
 */
export const COIN_PACKS = [
  { id: 'handful', coins: 300, label: 'A handful', emoji: '🪙' },
  { id: 'jar', coins: 800, label: 'A little jar', emoji: '🫙' },
  { id: 'treasure', coins: 2000, label: 'Treasure chest', emoji: '💰' },
];

const mockProvider = {
  name: 'demo',
  async purchase(packId) {
    const pack = COIN_PACKS.find((p) => p.id === packId);
    await new Promise((r) => setTimeout(r, 600));
    return { ok: true, coins: pack.coins };
  },
};

const serverProvider = {
  name: 'server',
  async purchase(packId) {
    const res = await api.post('/wallet/topup', { packId });
    return { ok: true, coins: res.coins, balance: res.balance };
  },
};

export const paymentProvider = DEMO_MODE ? mockProvider : serverProvider;
