// User text is always rendered through React (which escapes it), but we also
// trim, cap length and strip control characters before storing or sending.
export function cleanText(input, max = 2000) {
  if (typeof input !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export function validateImageFile(file) {
  if (!file) return 'No file selected';
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Please choose a JPG, PNG, WebP or GIF';
  if (file.size > MAX_IMAGE_BYTES) return 'That photo is a little too big (8 MB max)';
  return null;
}
