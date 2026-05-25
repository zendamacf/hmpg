import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    ...(process.env.VITEST
      ? []
      : [
          sentrySvelteKit({
            sourceMapsUploadOptions: {
              org: 'kalopsiadev',
              project: 'hmpg',
            },
          }),
        ]),
    sveltekit(),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary'],
      reportsDirectory: 'coverage',
      include: ['src/lib/**/*.ts', 'src/routes/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/app.d.ts',
        'src/lib/server/db/index.ts',
      ],
      thresholds: {
        lines: 35,
        statements: 40,
        branches: 45,
        functions: 45,
      },
    },
  },
});
