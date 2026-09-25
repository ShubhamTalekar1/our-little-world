import { config } from '../config.js';
import { HttpError } from '../lib/errors.js';

const ROMANTIC = new Set(['dance', 'date', 'letters', 'gifts', 'story']);

export function featureOpen(name) {
  if (config.relationship === 'friends' && ROMANTIC.has(name)) return false;
  return config.features.has('all') || config.features.has(name);
}

/** Server-side lock matching the client's: locked features can't be used via the API either. */
export const requireFeature = (name) => (_req, _res, next) => (featureOpen(name) ? next() : next(new HttpError(403, 'That part of the world isn’t open yet')));
