import http from 'node:http';
import { createApp } from './app.js';
import { attachRealtime } from './realtime/socket.js';
import { config } from './config.js';
import { prisma } from './db.js';

const server = http.createServer(createApp());
attachRealtime(server);

server.listen(config.port, () => {
  console.log(`🌙 Our Little World API listening on http://localhost:${config.port}`);
  if (!config.redisUrl) console.log('   presence: in-memory (set REDIS_URL to use Redis)');
  console.log(config.staticDir ? `   serving the web app from ${config.staticDir}` : '   API only (no built web app found)');
  console.log(`   mode: ${config.relationship} · open features: ${[...config.features].join(', ')}`);
});

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
