# One container: the API + realtime server, which also serves the built web app.
#   docker build -t our-little-world .
#   docker run -p 4000:4000 -e DATABASE_URL=... -e JWT_SECRET=... our-little-world

# ---- web app ----
FROM node:22-bookworm-slim AS client
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY client/ ./
# Build-time switches (public values, no secrets).
ARG VITE_FEATURES=chat,movie
ARG VITE_RELATIONSHIP=friends
ENV VITE_DEMO_MODE=false VITE_FEATURES=$VITE_FEATURES VITE_RELATIONSHIP=$VITE_RELATIONSHIP
RUN npm run build

# ---- server ----
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production PORT=4000 STATIC_DIR=/app/public UPLOAD_DIR=/data/uploads
COPY server/package.json server/package-lock.json ./
RUN npm ci --no-audit --no-fund --include=dev && npm cache clean --force
COPY server/prisma ./prisma
RUN npx prisma generate
COPY server/src ./src
COPY --from=client /app/client/dist ./public
RUN mkdir -p /data/uploads && chown -R node:node /data /app
USER node
VOLUME ["/data/uploads"]
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD node -e "fetch('http://localhost:'+(process.env.PORT||4000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Apply any pending database migrations, then start.
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
