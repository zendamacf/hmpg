# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

hmpg: a new tab replacement page that shows a random Unsplash photo, with a clock and location. SvelteKit 3 (adapter-node, Svelte 5) + PostgreSQL via Drizzle.

## Commands

Node.js 26 (see `.nvmrc`) and a Postgres reachable at `DATABASE_URL`.

```bash
npm ci --engine-strict=false
cp .env.development.example .env   # needs UNSPLASH_ACCESS_KEY, CRON_SECRET, DATABASE_URL
npm run db:migrate                 # apply Drizzle migrations
npm run start:dev                  # Vite dev server
npm run lint                       # Biome check (lint:fix to autofix; also run by the husky pre-commit hook)
npm run typecheck                  # svelte-kit sync && tsc --noEmit
npm run check                      # svelte-check
npm test                           # Vitest
npm run test:coverage              # enforces coverage thresholds (what CI runs)
npm run db:generate                # generate a migration after editing src/lib/server/db/schema.ts
npm run changeset                  # add a changeset for user-visible changes
```

Run a single test: `npx vitest run src/lib/time.test.ts` (add `-t "name"` to filter by test name). The `test` scripts run `npm run prepare` (husky) first.

## Testing

- Vitest runs in Node (`vitest-setup.ts` adds the jest-dom matchers). Tests sit next to the source: `*.test.ts`, and `*.component.test.ts` for Svelte components.
- Coverage covers `src/lib/**/*.ts` and `src/routes/**/*.ts`, with thresholds in `vite.config.ts`. `src/lib/server/db/index.ts` is excluded. Do not add untested logic to `src/lib`.

## Architecture

- **Layout**: `src/routes` (SvelteKit pages and endpoints: `+page.*`, `/health`, `/refresh`), `src/lib` (shared code), `src/lib/server` (server-only: `db`, `unsplash`, `image-pool`, `refresh-image`, `rate-limit`, logging). Import with the `#lib/*` alias (note the `.js` suffix in imports).
- **Env**: variables are declared in `src/env.ts` (`defineEnvVars`) and imported from `$app/env/private` or `$app/env/public`. Add new variables there.
- **Photos**: the home page loads a random row from the `image` table. If the table is empty, it refreshes from Unsplash with retries. `refreshImage` fetches new photos. `image-pool` keeps at most `MAX_STORED_IMAGES` (100) rows and prunes the oldest.
- **Cron**: `GET /refresh` is a public route. It must verify `Authorization: Bearer <CRON_SECRET>` itself, and it is rate limited. The Compose `cron` sidecar calls it daily (`docker/crontab`).
- **Settings**: user settings (12-hour clock, timezone, show attribution and location) live in the browser's local storage (`src/lib/settings.ts`), not in the database.
- **Database**: schema in `src/lib/server/db/schema.ts`. Migrations in `drizzle/` are generated. Never hand-edit the SQL, snapshots or journal.
- **Observability**: Sentry and Umami are optional and must work without configuration. Logging uses pino (`src/lib/server/logger.ts`).
- **Docker**: the multi-stage `Dockerfile` builds the SvelteKit `build/` output. `docker/entrypoint.sh` applies migrations (a bundled `migrate.mjs`) before it starts the server. The CI `deploy-smoke` job builds the image, starts the Compose stack and checks the main routes.
- **Dependencies**: Vite bundles the font and icon CSS at build time, so those packages are `devDependencies`. Keep runtime-only packages in `dependencies`, because the Docker image installs only those.

## Workflow notes

- Add a changeset (`npm run changeset`) for user-visible changes. The version and `CHANGELOG.md` are managed by Changesets.
- Style is enforced by Biome. Run `npm run lint:fix` instead of formatting by hand.

## Commit format

Conventional Commits, as seen in recent history: `type(scope): lowercase imperative summary (#PR)`, for example `fix(ui): link photo credit to Unsplash pages (#185)`. Types in use: `feat`, `fix`, `chore` (`chore(docker): ...`, `chore(deps): ...`, `chore: release X.Y.Z` for releases), `docs`. A scope is optional and names the feature area (`ui`, `docker`, ...). Reference the PR number in parentheses at the end.
