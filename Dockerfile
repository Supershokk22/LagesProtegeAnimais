# syntax=docker/dockerfile:1
# =============================================================================
# LAGES PROTEGE ANIMAIS — imagem de produção
# =============================================================================

# --- deps ------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# --- build -----------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Valores de build sao sentinelas: NUNCA embutir segredo real na imagem.
ENV NEXT_TELEMETRY_DISABLED=1
ENV AUTH_SECRET=build-time-placeholder-not-used-at-runtime-000
ENV TOTP_ENCRYPTION_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
ENV PASSWORD_PEPPER=build-time-placeholder
RUN npx prisma generate && npm run build

# --- runtime ---------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache openssl curl \
 && addgroup -g 1001 -S nodejs \
 && adduser -u 1001 -S nextjs -G nodejs

# Prisma precisa do engine; as deps de produção ficam íntegras.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

RUN mkdir -p /data/evidencias && chown -R nextjs:nodejs /app /data
USER nextjs
EXPOSE 3000

CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000"]