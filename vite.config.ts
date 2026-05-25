import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
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
    svelteTesting(),
  ],
  test: {
    environment: 'node',
    setupFiles: ['./vitest-setup.ts'],
    include: ['src/**/*.{test,spec,component.test}.{js,ts}'],
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
        lines: 95,
        statements: 90,
        branches: 95,
        functions: 75,
      },
    },
  },
});
