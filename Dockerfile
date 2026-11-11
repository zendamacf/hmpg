# syntax=docker/dockerfile:1

FROM node:26-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --engine-strict=false

FROM deps AS build
COPY . .
# SvelteKit postbuild imports server modules; these must be set (connection not required at build).
ARG DATABASE_URL=postgresql://hmpg:hmpg@postgres:5432/hmpg
ARG UNSPLASH_ACCESS_KEY=build-placeholder
ARG CRON_SECRET=build-placeholder
ENV HUSKY=0 \
  DOCKER_BUILD=1 \
  DATABASE_URL=$DATABASE_URL \
  UNSPLASH_ACCESS_KEY=$UNSPLASH_ACCESS_KEY \
  CRON_SECRET=$CRON_SECRET
RUN npm run build \
  && node_modules/.bin/esbuild docker/migrate.ts \
    --bundle --platform=node --format=esm --minify \
    --outfile=/app/migrate.mjs

FROM node:26-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --engine-strict=false

FROM node:26-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
  HOST=0.0.0.0 \
  PORT=3000 \
  HUSKY=0 \
  HOME=/home/sveltekit

RUN apk add --no-cache dumb-init \
  && addgroup -S -g 1001 nodejs \
  && adduser -S -u 1001 -G nodejs -h /home/sveltekit sveltekit \
  && chown sveltekit:nodejs /app

COPY --chown=sveltekit:nodejs package.json ./
COPY --from=prod-deps --chown=sveltekit:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=sveltekit:nodejs /app/build ./build
COPY --from=build --chown=sveltekit:nodejs /app/drizzle ./drizzle
COPY --from=build --chown=sveltekit:nodejs /app/migrate.mjs ./migrate.mjs
COPY --chown=sveltekit:nodejs --chmod=755 docker/entrypoint.sh ./docker/entrypoint.sh

USER sveltekit
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--", "./docker/entrypoint.sh"]
