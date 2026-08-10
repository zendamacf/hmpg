# hmpg

[![Build Status](https://github.com/zendamacf/hmpg/workflows/Tests/badge.svg)](https://github.com/zendamacf/hmpg/actions/workflows/tests.yml)

A new tab replacement page.
[hmpg.kalopsia.dev](https://hmpg.kalopsia.dev)

## Local development

```bash
cp .env.development.example .env   # set UNSPLASH_ACCESS_KEY, CRON_SECRET, DATABASE_URL
npm ci --engine-strict=false
npm run db:migrate
npm run start:dev
```

## Docker

```bash
cp .env.example .env   # production Compose secrets (DB_PASSWORD, CRON_SECRET, …)
# Local/CI: build from source
docker compose -f docker-compose.yml -f docker-compose.ci.yml up --build
# APP_IMAGE=ghcr.io/zendamacf/hmpg:v0.0.3 docker compose --profile production up -d
```
