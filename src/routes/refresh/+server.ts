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

export const GET: RequestHandler = async () => {
  const photo = await UnsplashAPI.getRandom(KEYWORDS);

  await db.insert(image).values({
    unsplashid: photo.id,
    latitude: photo.location.latitude?.toString(),
    longitude: photo.location.longitude?.toString(),
    location: photo.location.name,
    author_name: photo.author.name,
    author_instagram: photo.author.instagram,
    url: photo.urls.full,
  });
  return new Response();
};
