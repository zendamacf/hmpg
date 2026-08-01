import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { image } from '$lib/server/db/schema';
import { UnsplashAPI } from '$lib/server/unsplash';
import type { RequestHandler } from './$types';

const KEYWORDS = [
  'landscape',
  'water',
  'aerial',
  'places',
  'city',
  'sunset',
  'flowers',
  'snow',
  'temple',
  'mountain',
  'wanderlust',
];

export const GET: RequestHandler = async ({ request }) => {
  const secret = env.CRON_SECRET;
  if (!secret) throw new Error('CRON_SECRET is not set');

  const authorization = request.headers.get('Authorization');
  if (authorization !== `Bearer ${secret}`) {
    return new Response(null, { status: 401 });
  }

  const photo = await UnsplashAPI.getRandom(KEYWORDS);

  await db
    .insert(image)
    .values({
      unsplashid: photo.id,
      latitude: photo.location.latitude?.toString(),
      longitude: photo.location.longitude?.toString(),
      location: photo.location.name,
      author_name: photo.author.name,
      author_instagram: photo.author.instagram,
      url: photo.urls.full,
    })
    .onConflictDoNothing({ target: image.unsplashid });
  return new Response();
};
