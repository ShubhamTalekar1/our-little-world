import { z } from 'zod';
import { badRequest } from './errors.js';

/** Parse and replace req.body (or query) with a zod schema. */
export const validate = (schema, where = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[where] ?? {});
  if (!result.success) return next(badRequest('Invalid input', result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))));
  req.valid = result.data;
  next();
};

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
/** Trimmed, control-character-free text. React escapes on render; we still store clean text. */
export const text = (max) => z.string().transform((s) => s.replace(CONTROL, '').trim()).pipe(z.string().max(max));

/** Clients generate ids for optimistic updates; accept them only in a safe shape. */
export const clientId = z.string().regex(/^[a-z]{1,6}_[a-z0-9]{6,32}$/i).optional();
export const isoDate = z.coerce.date();
export { z };
