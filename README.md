# hmpg

[![Build Status](https://github.com/zendamacf/hmpg/workflows/PR%20Tests/badge.svg)](https://github.com/zendamacf/hmpg/actions/workflows/pr-tests.yml)

A new tab replacement page.
[hmpg.kalopsia.dev](https://hmpg.kalopsia.dev)

Self-hosted with Docker Compose (Node + Postgres). See [MIGRATION.md](./MIGRATION.md) for VPS cutover steps (DNS, GitHub secrets, data restore).

## Local development

```bash
cp .env.example .env   # set UNSPLASH_ACCESS_KEY, CRON_SECRET, DATABASE_URL
npm ci --engine-strict=false
npm run db:migrate
npm run start:dev
```

## Docker

```bash
cp .env.example .env   # fill secrets
docker compose -f docker-compose.yml -f docker-compose.ci.yml up --build
# Production-like (Caddy TLS + cron): docker compose --profile production up --build
```
