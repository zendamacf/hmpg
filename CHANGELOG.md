# hmpg

## 0.2.1

### Patch Changes

- e510fef: Updated @sentry/sveltekit, @fortawesome/fontawesome-free (version-update:semver-major).
- ba9d4f0: Use self-hosted Font Awesome for UI icons instead of inline SVG paths.
- 19df9b2: Fix cron refresh not working.

## 0.2.0

### Minor Changes

- e8d9d43: Show an optional Instagram link in photo attribution when `author_instagram` is set.
- 3efee6a: Add homepage empty state with retry when no background photo is available, including limited refresh retries on page load.
- 9997f97: Rate limit authenticated `/refresh` requests per client IP to reduce abusive Unsplash usage.
- e8d9d43: Add client-side display settings persisted in `localStorage` (12/24-hour clock, timezone override, and visibility toggles).

### Patch Changes

- 43e38fb: Align Docker base images with Node.js 26 to match `.nvmrc` and GitHub Actions.
- 3efee6a: Cap stored background images at 100 rows and prune oldest entries after each refresh.
- e8d9d43: Clear the clock `setInterval` when the home page component is destroyed.
- 9b99b88: Updated brace-expansion from 5.0.9 to 5.0.12 (version-update:semver-patch).
- 09a21be: Updated devalue from 5.8.1 to 5.9.2 (version-update:semver-minor).
- c1600f9: Updated @biomejs/biome, svelte, vite (version-update:semver-patch).
- efcf42b: Updated @changesets/cli, @sveltejs/kit (version-update:semver-patch).
- 057b44e: Updated @biomejs/biome (version-update:semver-patch).
- cfc6335: Updated @sentry/sveltekit, @biomejs/biome, @types/node, lint-staged, svelte (version-update:semver-minor).
- 3c63fc9: Updated @sentry/sveltekit, @types/node (version-update:semver-minor).
- d5c03c2: Updated undici from 8.9.0 to 8.11.2 (version-update:semver-minor).
- e8d9d43: Use HTTPS Google Maps search URLs for the location button.
- e8d9d43: Declare `App.PageData` from the Drizzle `image` model for accurate SvelteKit page typing.
- e988efd: Lower default Sentry performance trace sampling in production to 0.1, with optional override via `PUBLIC_SENTRY_TRACES_SAMPLE_RATE`.
- 43e38fb: Migrate Biome configuration to schema 2.5.11 so `npm run lint` no longer reports a migration warning.
- 43e38fb: Move `drizzle-kit` to devDependencies while keeping migrations working in the production Docker image.
- 3e93d98: Rename the misspelled `unspashid` database column to `unsplash_id` and align Drizzle schema and application code.
- f3f08f0: Self-host Lato via Fontsource and replace the Font Awesome kit with inline SVG icons.
- a29a986: Add Umami integration for analytics.

## 0.1.3

### Patch Changes

- 0147e4e: Updated brace-expansion from 5.0.8 to 5.0.9 (version-update:semver-patch).
- 1762d7a: Updated browserslist from 4.28.2 to 4.28.8 (version-update:semver-patch).
- 2365258: Updated @sentry/sveltekit, @biomejs/biome, vite (version-update:semver-major).
- ae47adc: Updated unsplash-js, svelte, svelte-check (version-update:semver-patch).
- 6dc43a9: Updated @biomejs/biome, jsdom (version-update:semver-patch).
- 037e289: Updated @biomejs/biome, @changesets/cli (version-update:semver-major).
- f05af19: Updated @sentry/sveltekit, lint-staged, vite (version-update:semver-minor).
- 0e11ae5: Updated @testing-library/jest-dom (version-update:semver-patch).
- 6cc8e08: Updated @sentry/sveltekit (version-update:semver-minor).
- a9a3968: Updated @sentry/sveltekit, @sveltejs/kit, @sveltejs/vite-plugin-svelte, @types/node, svelte-check (version-update:semver-minor).
- 12074e8: Updated @sentry/sveltekit, lint-staged, svelte (version-update:semver-minor).
- 65d9319: Updated @sentry/sveltekit, @biomejs/biome, @testing-library/jest-dom, lint-staged, svelte (version-update:semver-major).
- e12a7c0: Updated @sentry/sveltekit, @changesets/cli, svelte, svelte-check, vite (version-update:semver-minor).
- e7259b2: Updated lint-staged (version-update:semver-minor).
- 2e618c5: Updated @sveltejs/vite-plugin-svelte (version-update:semver-patch).
- a2f16f9: Updated jsdom (version-update:semver-major).
- 9308ce1: Updated @biomejs/biome (version-update:semver-patch).
- c29677a: Updated @types/node, svelte-check (version-update:semver-patch).
- f8a3ce2: Updated @biomejs/biome, svelte (version-update:semver-patch).
- e352332: Updated @sveltejs/vite-plugin-svelte, @types/node, svelte-check, vite (version-update:semver-minor).
- 13f07ec: Updated js-yaml, js-yaml.
- f2668ea: Updated @sveltejs/kit from 2.69.2 to 2.70.2 (version-update:semver-minor).
- ca4b4db: Updated undici from 7.28.0 to 7.29.0 (version-update:semver-minor).
- d5f6b63: Updated vitest from 4.1.10 to 4.1.11 (version-update:semver-patch).

## 0.1.2

### Patch Changes

- f7a2360: Added more logging using Pino.
- f7a2360: Removed Refresh button - this hasn't been working since the refresh was guarded behind a Cron secret.
- 9022fdb: Updates initial page load to fetch an image if the database has no images.
- f7a2360: Fixed Unsplash refresh not working anymore.
- f7a2360: Fixed incorrect Biome version in config.

## 0.1.1

### Patch Changes

- 75d1bf6: Removes Caddy from deployment in favour of just exposing ports.

## 0.1.0

### Minor Changes

- 6193ce7: Self-host with adapter-node and Docker Compose instead of Vercel.

### Patch Changes

- 155d79a: Updated tar from 7.5.11 to 7.5.16 (version-update:semver-patch).
- 73a7653: Switched from Neon database in GitHub CI/CD to PostgreSQL service.
- ab08344: Added CI workflow to automatically create changesets for Dependabot pull requests.
- 8cfa90c: Updated brace-expansion from 5.0.6 to 5.0.7 (version-update:semver-patch).
- f7cd2c3: Updated brace-expansion from 5.0.7 to 5.0.8 (version-update:semver-patch).
- 69f906f: Updated drizzle-kit from 0.31.1 to 0.31.10 (version-update:semver-patch).
- 624c866: Updated @sentry/sveltekit, postgres, @biomejs/biome, @sveltejs/kit, @types/node, svelte, vite (version-update:semver-minor).
- c1abf8d: Updated @vitest/coverage-v8, vitest (version-update:semver-patch).
- a9e8b76: Updated @sveltejs/kit (version-update:semver-patch).
- 169bdbd: Updated lint-staged from 17.0.5 to 17.0.8 (version-update:semver-patch).
- ab08344: Updated @opentelemetry/core from 2.0.1 to 2.8.0, @sentry/sveltekit from 9.30.0 to 10.58.0 (version-update:semver-major).
- a55fc2d: Updated postcss from 8.5.16 to 8.5.23 (version-update:semver-patch).
- 1a98abc: Updated @sentry/sveltekit from 10.58.0 to 10.61.0 (version-update:semver-minor).
- 6c3c499: Updated svelte from 5.55.7 to 5.56.3 (version-update:semver-minor).
- e553835: Updated svelte-check from 4.2.1 to 4.7.1 (version-update:semver-minor).
- aa38394: Updated @sveltejs/adapter-vercel from 6.3.2 to 6.3.4 (version-update:semver-patch).
- 362834b: Updated @sveltejs/kit from 2.60.1 to 2.68.0 (version-update:semver-minor).
- ca60150: Updated @sveltejs/vite-plugin-svelte from 5.1.0 to 7.1.2, vite from 6.4.2 to 8.0.16 (version-update:semver-major).
- e2678cf: Updated tar from 7.5.16 to 7.5.21 (version-update:semver-patch).
- 2580154: Updated @testing-library/svelte from 5.3.1 to 5.4.2 (version-update:semver-minor).
- 7599a92: Updated @types/node from 25.9.3 to 26.0.0 (version-update:semver-major).
- dbd06c6: Updated typescript from 5.8.3 to 6.0.3 (version-update:semver-major).
- 4594d59: Updated undici from 7.25.0 to 7.28.0 (version-update:semver-minor).
- 51bf42f: Updated unsplash-js from 7.0.19 to 8.0.0 (version-update:semver-major).
- d9c9964: Updated @vercel/analytics from 1.5.0 to 2.0.1 (version-update:semver-major).
- 0e6d7eb: Updated @vitest/coverage-v8 from 4.1.7 to 4.1.9 (version-update:semver-patch).
- b3f9879: Updated @types/node from 22.15.31 to 25.9.3 (version-update:semver-major).
- fa3c655: Group all dependencies together for Dependabot scanning to reduce PR noise.
- 155d79a: Updated brace-expansion from 5.0.5 to 5.0.6 (version-update:semver-patch).

## 0.0.2

### Patch Changes

- 62567f4: Added app-wide test coverage using Vitest.
- 62567f4: Adds Drizzle migrations.
- 62567f4: Updated CI checks with testing, coverage, Neon database branching, production migrations.

## 0.0.1

Initial release.
