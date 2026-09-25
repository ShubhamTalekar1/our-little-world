import { HttpError } from '../lib/errors.js';

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, details: err.details });
  if (err?.code === 'P2002') return res.status(409).json({ error: 'That already exists' });
  if (err?.code === 'P2025') return res.status(404).json({ error: 'Not found' });
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'That’s too large' });
  if (err?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'That file is too large (8 MB max)' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side' });
}
