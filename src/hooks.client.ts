import * as Sentry from '@sentry/sveltekit';
import { handleErrorWithSentry } from '@sentry/sveltekit';
import { tracesSampleRate } from '#lib/sentry-traces-sample-rate.js';
import { dev } from '$app/env';
import { PUBLIC_SENTRY_DSN } from '$app/env/public';

Sentry.init({
  dsn: PUBLIC_SENTRY_DSN,
  tracesSampleRate: tracesSampleRate(),
  environment: dev ? 'development' : 'production',
});

export const handleError = handleErrorWithSentry();
