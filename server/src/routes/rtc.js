import { Router } from 'express';
import { config } from '../config.js';

const router = Router();

/** ICE servers for WebRTC. TURN credentials live in server env, not in the web bundle. */
router.get('/ice-servers', (_req, res) => {
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.json({ iceServers: config.iceServers });
});

export default router;
