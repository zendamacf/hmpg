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
  },
});
