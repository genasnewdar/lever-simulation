# ── Stage 1: Dependencies ──
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Build ──
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Auth0 env vars needed at build time for middleware compilation
ARG AUTH0_SECRET
ARG AUTH0_DOMAIN
ARG AUTH0_CLIENT_ID
ARG AUTH0_CLIENT_SECRET
ARG APP_BASE_URL
ARG AUTH0_AUDIENCE
ARG AUTH0_SCOPE
ARG NEXT_PUBLIC_API_URL
ARG SYSTEM_API_KEY

ENV AUTH0_SECRET=$AUTH0_SECRET
ENV AUTH0_DOMAIN=$AUTH0_DOMAIN
ENV AUTH0_CLIENT_ID=$AUTH0_CLIENT_ID
ENV AUTH0_CLIENT_SECRET=$AUTH0_CLIENT_SECRET
ENV APP_BASE_URL=$APP_BASE_URL
ENV AUTH0_AUDIENCE=$AUTH0_AUDIENCE
ENV AUTH0_SCOPE=$AUTH0_SCOPE
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV SYSTEM_API_KEY=$SYSTEM_API_KEY

RUN npm run build

# ── Stage 3: Production runner ──
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Cloud Run sets PORT env var (default 8080)
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"
EXPOSE 8080

CMD ["node", "server.js"]
