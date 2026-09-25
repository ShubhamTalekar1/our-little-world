import { Router } from 'express';
import { ah } from '../lib/errors.js';
import { partnerOf } from '../middleware/auth.js';
import { publicPresence } from '../realtime/presence.js';

const router = Router();

router.get(
  '/',
  ah(async (req, res) => {
    const partner = await partnerOf(req.user);
    res.json({ partner: partner ? await publicPresence(partner.id, partner.lastSeenAt) : null });
  }),
);

export default router;
