import { sentrySvelteKit } from '@sentry/sveltekit/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vite';

export default defineConfig(async () => {
  const sentryPlugins =
    process.env.VITEST || process.env.DOCKER_BUILD
      ? []
      : await sentrySvelteKit({
          org: 'kalopsiadev',
          project: 'hmpg',
        });

  return {
    plugins: [...sentryPlugins, ...(await sveltekit()), svelteTesting()],
    test: {
      environment: 'node',
      setupFiles: ['./vitest-setup.ts'],
      include: ['src/**/*.{test,spec,component.test}.{js,ts}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'json-summary', 'lcov'],
        reportsDirectory: 'coverage',
        include: ['src/lib/**/*.ts', 'src/routes/**/*.ts'],
        exclude: [
          'src/**/*.test.ts',
          'src/**/*.spec.ts',
          'src/app.d.ts',
          'src/lib/server/db/index.ts',
        ],
        thresholds: {
          lines: 90,
          statements: 90,
          branches: 75,
          functions: 90,
        },
      },
    },
  };
});
