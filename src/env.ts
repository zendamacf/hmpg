import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
  PUBLIC_SENTRY_DSN: { public: true, schema: (input) => input ?? '' },
  PUBLIC_UMAMI_URL: { public: true, schema: (input) => input ?? '' },
  PUBLIC_UMAMI_WEBSITE_ID: { public: true, schema: (input) => input ?? '' },
  CRON_SECRET: { schema: (input) => input ?? '' },
  PUBLIC_SENTRY_TRACES_SAMPLE_RATE: { public: true, schema: (input) => input ?? '' },
  UNSPLASH_ACCESS_KEY: { schema: (input) => input ?? '' },
  DATABASE_URL: { schema: (input) => input ?? '' },
});
