import { env } from '$env/dynamic/private';
import { logger } from '$lib/server/logger';
import { checkRateLimit } from '$lib/server/rate-limit';
import { refreshImage } from '$lib/server/refresh-image';
import type { RequestHandler } from './$types';

const REFRESH_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,
  max: 10,
};

const clientIp = (request: Request): string => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
};

export const GET: RequestHandler = async ({ request }) => {
  const secret = env.CRON_SECRET;
  if (!secret) throw new Error('CRON_SECRET is not set');

  const authorization = request.headers.get('Authorization');
  if (authorization !== `Bearer ${secret}`) {
    logger.warn({ path: '/refresh' }, 'unauthorized refresh attempt');
    return new Response(null, { status: 401 });
  }

  const rateLimitKey = `refresh:${clientIp(request)}`;
  const rateLimit = checkRateLimit(rateLimitKey, REFRESH_RATE_LIMIT);
  if (!rateLimit.allowed) {
    logger.warn({ path: '/refresh', ip: clientIp(request) }, 'refresh rate limit exceeded');
    return new Response(null, {
      status: 429,
      headers: {
        'Retry-After': String(rateLimit.retryAfterSeconds),
      },
    });
  }

  logger.info({ trigger: 'cron' }, 'refresh started');
  await refreshImage('cron');
  return new Response();
};
