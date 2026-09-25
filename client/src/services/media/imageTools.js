import { validateImageFile } from '../../lib/sanitize';

/**
 * Downscale an image in the browser. In demo mode the result (a JPEG data
 * URL) is stored locally; with a backend, the original goes through
 * uploadImage() below instead.
 */
export async function resizeImage(file, max = 1200, quality = 0.82) {
  const err = validateImageFile(file);
  if (err) throw new Error(err);
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('That image couldn’t be read'));
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const blobToDataUrl = (blob) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
