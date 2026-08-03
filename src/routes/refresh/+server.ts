import { env } from '$env/dynamic/private';
import { refreshImage } from '$lib/server/refresh-image';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
  const secret = env.CRON_SECRET;
  if (!secret) throw new Error('CRON_SECRET is not set');

  const authorization = request.headers.get('Authorization');
  if (authorization !== `Bearer ${secret}`) {
    return new Response(null, { status: 401 });
  }

  await refreshImage();
  return new Response();
};
