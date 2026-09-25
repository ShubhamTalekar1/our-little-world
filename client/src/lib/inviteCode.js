// Unambiguous alphabet (no 0/O, 1/I/L).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function makeInviteCode() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return `LOVE-${[...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('')}`;
}
export const normalizeInviteCode = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^LOVE/, 'LOVE-');
