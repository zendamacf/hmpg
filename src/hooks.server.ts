import * as Sentry from '@sentry/sveltekit';
import { handleErrorWithSentry, sentryHandle } from '@sentry/sveltekit';
import { type HandleServerError, sequence } from '@sveltejs/kit/hooks';
import { tracesSampleRate } from '#lib/sentry-traces-sample-rate.js';
import { logHandle } from '#lib/server/log-handle.js';
import { logger } from '#lib/server/logger.js';
import { dev } from '$app/env';
import { PUBLIC_SENTRY_DSN } from '$app/env/public';

Sentry.init({
  dsn: PUBLIC_SENTRY_DSN,
  tracesSampleRate: tracesSampleRate(),
  environment: dev ? 'development' : 'production',
});

export const handle = sequence(sentryHandle(), logHandle);

const errorStatus = (error: unknown): number => {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: unknown }).status;
    if (typeof status === 'number') {
      return status;
    }
  }
  return 500;
};

export const handleError: HandleServerError = handleErrorWithSentry(({ error, event }) => {
  const status = errorStatus(error);
  const message = error instanceof Error ? error.message : String(error);

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
});
