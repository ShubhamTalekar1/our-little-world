import { DEMO_MODE } from '../../config/env';
import { api } from '../api/client';
import { resizeImage } from './imageTools';

/** Returns a URL for an image: a local data URL in demo mode, an uploaded path otherwise. */
export async function uploadImage(file, { max = 1400 } = {}) {
  if (DEMO_MODE) return resizeImage(file, max);
  const form = new FormData();
  form.append('file', file);
  const res = await api.upload('/media', form);
  return res.url;
}
