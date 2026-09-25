const env = process.env;
const isProd = env.NODE_ENV === 'production';

if (isProd && !env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

export const config = {
  isProd,
  port: Number(env.PORT ?? 4000),
  jwtSecret: env.JWT_SECRET ?? 'dev-only-secret-change-me',
  jwtTtl: '30d',
  corsOrigins: (env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map((s) => s.trim()),
  redisUrl: env.REDIS_URL || null,
  uploadDir: env.UPLOAD_DIR ?? new URL('../uploads/', import.meta.url).pathname,
  maxUploadBytes: 8 * 1024 * 1024,
  startingCoins: 500,
  dailyReward: 50,
};
