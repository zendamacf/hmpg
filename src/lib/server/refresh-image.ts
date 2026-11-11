import { db } from '#lib/server/db/index.js';
import { image } from '#lib/server/db/schema.js';
import { pruneStoredImages } from '#lib/server/image-pool.js';
import { logger } from '#lib/server/logger.js';
import { UnsplashAPI } from '#lib/server/unsplash.js';

/**
 * Search keywords for new photos. Each stored photo keeps the keyword that found it
 * (`image.tag`), and the page offers the tags that exist in the table as topics.
 * Keep them short and lowercase: they are also shown to users as topic names.
 */
export const KEYWORDS = [
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
  'forest',
  'beach',
  'ocean',
  'desert',
  'lake',
  'waterfall',
  'river',
  'island',
  'coast',
  'canyon',
  'glacier',
  'volcano',
  'jungle',
  'countryside',
  'village',
  'architecture',
  'bridge',
  'skyline',
  'night',
  'autumn',
  'winter',
  'sunrise',
  'fog',
  'aurora',
] as const;

export async function refreshImage(trigger: 'cron' | 'page-load' = 'cron') {
  const photo = await UnsplashAPI.getRandom(KEYWORDS);
  if (!photo) {
    logger.warn({ trigger }, 'no photo found');
    return;
  }

  const inserted = await db
    .insert(image)
    .values({
      unsplash_id: photo.id,
      latitude: photo.location.latitude?.toString(),
      longitude: photo.location.longitude?.toString(),
      location: photo.location.name,
      author_name: photo.author.name,
      author_username: photo.author.username,
      author_instagram: photo.author.instagram,
      url: photo.urls.full,
      tag: photo.tag,
    })
    .onConflictDoNothing({ target: image.unsplash_id })
    .returning({ id: image.id });

  if (inserted.length === 0) {
    logger.info(
      {
        trigger,
        unsplashId: photo.id,
        tag: photo.tag,
        location: photo.location.name,
        author: photo.author.name,
      },
      'skipped duplicate image',
    );
  } else {
    logger.info(
      {
        trigger,
        unsplashId: photo.id,
        tag: photo.tag,
        location: photo.location.name,
        author: photo.author.name,
      },
      'image refreshed',
    );
  }

  await pruneStoredImages();
}
