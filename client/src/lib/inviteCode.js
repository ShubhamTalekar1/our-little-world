import { FRIENDS } from '../config/features';

// Unambiguous alphabet (no 0/O, 1/I/L).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function makeInviteCode() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return `${FRIENDS ? 'HI' : 'LOVE'}-${[...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('')}`;
}
export const INVITE_EXAMPLE = FRIENDS ? 'HI-7K4P' : 'LOVE-7K4P';
export const normalizeInviteCode = (s) =>
  s
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/^(HI|LOVE)([A-Z0-9]{4})$/, '$1-$2');
export const isInviteCode = (s) => /^(HI|LOVE)-[A-Z0-9]{4}$/.test(normalizeInviteCode(s));
