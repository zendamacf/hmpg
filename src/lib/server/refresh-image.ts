import { db } from '$lib/server/db';
import { image } from '$lib/server/db/schema';
import { logger } from '$lib/server/logger';
import { UnsplashAPI } from '$lib/server/unsplash';

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

export async function refreshImage(trigger: 'cron' | 'page-load' = 'cron') {
  const photo = await UnsplashAPI.getRandom(KEYWORDS);
  if (!photo) {
    logger.warn({ trigger }, 'no photo found');
    return;
  }

  const inserted = await db
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
    .onConflictDoNothing({ target: image.unsplashid })
    .returning({ id: image.id });

  if (inserted.length === 0) {
    logger.info(
      { trigger, unsplashId: photo.id, location: photo.location.name, author: photo.author.name },
      'skipped duplicate image',
    );
    return;
  }

  logger.info(
    { trigger, unsplashId: photo.id, location: photo.location.name, author: photo.author.name },
    'image refreshed',
  );
}
