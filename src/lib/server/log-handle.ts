import type { Handle } from '@sveltejs/kit';
import { logger } from '$lib/server/logger';

export const logHandle: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname;
  if (path === '/health') {
    return resolve(event);
  }

  const start = performance.now();
  const response = await resolve(event);
  const durationMs = Math.round(performance.now() - start);
  const { method } = event.request;
  const { status } = response;

  const fields = { method, path, status, durationMs };
  if (status >= 500) {
    logger.error(fields, 'request');
  } else if (status >= 400) {
    logger.warn(fields, 'request');
  } else {
    logger.info(fields, 'request');
  }

  return response;
};
