import * as Sentry from '@sentry/sveltekit';
import { handleErrorWithSentry, sentryHandle } from '@sentry/sveltekit';
import type { HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import { tracesSampleRate } from '$lib/sentry-traces-sample-rate';
import { logHandle } from '$lib/server/log-handle';
import { logger } from '$lib/server/logger';

Sentry.init({
  dsn: env.PUBLIC_SENTRY_DSN,
  tracesSampleRate: tracesSampleRate(),
  environment: dev ? 'development' : 'production',
});

export const handle = sequence(sentryHandle(), logHandle);

export const handleError: HandleServerError = handleErrorWithSentry(
  ({ error, event, status, message }) => {
    logger.error(
      {
        err: error,
        method: event.request.method,
        path: event.url.pathname,
        status,
        message,
      },
      'unhandled error',
    );
  },
);
