# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --engine-strict=false

FROM deps AS build
COPY . .
ENV HUSKY=0 \
  DOCKER_BUILD=1
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
  HOST=0.0.0.0 \
  PORT=3000 \
  HUSKY=0

RUN apt-get update \
  && apt-get install -y --no-install-recommends dumb-init \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs sveltekit

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --engine-strict=false \
  && npm install drizzle-kit --no-save --ignore-scripts --engine-strict=false

COPY --from=build --chown=sveltekit:nodejs /app/build ./build
COPY --from=build --chown=sveltekit:nodejs /app/drizzle ./drizzle
COPY --from=build --chown=sveltekit:nodejs /app/drizzle.config.ts ./
COPY --from=build --chown=sveltekit:nodejs /app/src/lib/server/db ./src/lib/server/db
COPY --chown=sveltekit:nodejs docker/entrypoint.sh ./docker/entrypoint.sh

RUN chmod +x ./docker/entrypoint.sh

USER sveltekit
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--", "./docker/entrypoint.sh"]
