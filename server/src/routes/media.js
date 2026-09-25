import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { prisma } from '../db.js';
import { ah, badRequest, notFound } from '../lib/errors.js';
import { config } from '../config.js';

const router = Router();

// Trust file contents, not the file name or the browser's claimed type.
const SIGNATURES = [
  { mime: 'image/jpeg', ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', ext: 'png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: 'image/gif', ext: 'gif', test: (b) => b.subarray(0, 4).toString('ascii') === 'GIF8' },
  { mime: 'image/webp', ext: 'webp', test: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
];

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.maxUploadBytes, files: 1 } });

router.post(
  '/',
  upload.single('file'),
  ah(async (req, res) => {
    if (!req.file) throw badRequest('No file received');
    const kind = SIGNATURES.find((s) => s.test(req.file.buffer));
    if (!kind) throw badRequest('Please upload a JPG, PNG, GIF or WebP image');
    const dir = path.join(config.uploadDir, req.coupleId);
    await fs.promises.mkdir(dir, { recursive: true });
    const name = `${crypto.randomUUID()}.${kind.ext}`;
    await fs.promises.writeFile(path.join(dir, name), req.file.buffer);
    await prisma.media.create({ data: { coupleId: req.coupleId, uploaderId: req.user.id, path: `${req.coupleId}/${name}`, mime: kind.mime, size: req.file.size } });
    res.status(201).json({ url: `/api/media/${req.coupleId}/${name}` });
  }),
);

/** Private files: only the two people in the couple can fetch them. */
router.get(
  '/:coupleId/:file',
  ah(async (req, res) => {
    if (req.params.coupleId !== req.coupleId) throw notFound();
    if (!/^[0-9a-f-]{36}\.(jpg|png|gif|webp)$/.test(req.params.file)) throw notFound();
    const media = await prisma.media.findFirst({ where: { coupleId: req.coupleId, path: `${req.coupleId}/${req.params.file}` } });
    if (!media) throw notFound();
    res.setHeader('Content-Type', media.mime);
    res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    fs.createReadStream(path.join(config.uploadDir, media.path)).on('error', () => res.status(404).end()).pipe(res);
  }),
);

export default router;
