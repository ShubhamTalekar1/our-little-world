import { COIN_PACKS } from '../catalog.js';
import { badRequest } from '../lib/errors.js';

/**
 * Coin top-ups. There are no real-money payments yet: the "free" provider
 * grants packs directly. To add Stripe, implement `createCheckout(user, pack)`
 * returning a Checkout URL and credit coins from a verified webhook
 * (never from the client). STRIPE_SECRET_KEY would live only in server env.
 */
const freeProvider = {
  name: 'free',
  async topUp(packId) {
    const coins = COIN_PACKS[packId];
    if (!coins) throw badRequest('Unknown pack');
    return { coins };
  },
};

export const paymentProvider = freeProvider;
