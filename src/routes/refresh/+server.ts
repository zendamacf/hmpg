import { env } from '$env/dynamic/private';
import { logger } from '$lib/server/logger';
import { refreshImage } from '$lib/server/refresh-image';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
  const secret = env.CRON_SECRET;
  if (!secret) throw new Error('CRON_SECRET is not set');

  const authorization = request.headers.get('Authorization');
  if (authorization !== `Bearer ${secret}`) {
    logger.warn({ path: '/refresh' }, 'unauthorized refresh attempt');
    return new Response(null, { status: 401 });
  }

  logger.info({ trigger: 'cron' }, 'refresh started');
  await refreshImage('cron');
  return new Response();
};
