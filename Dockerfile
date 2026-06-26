FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
RUN bun install

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL=postgres://peek:peek@localhost:5432/peek
ENV SESSION_SECRET=build-time-placeholder
ENV APP_URL=http://localhost:3000
RUN bun run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/packages/db/drizzle.config.ts ./packages/db/drizzle.config.ts
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["./docker-entrypoint.sh"]
