# ─── ARKON Backend Dockerfile (Production) ──────────────
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source
COPY . .

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S arkon -u 1001
RUN chown -R arkon:nodejs /app
USER arkon

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
