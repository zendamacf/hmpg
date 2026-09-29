import { asc, count, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { image } from '$lib/server/db/schema';
import { logger } from '$lib/server/logger';

/** Maximum rows kept in `image`; oldest rows (by `id`) are removed after refresh. */
export const MAX_STORED_IMAGES = 100;

export const pruneStoredImages = async (): Promise<number> => {
  const [{ total }] = await db.select({ total: count() }).from(image);
  const totalCount = Number(total);
  const excess = totalCount - MAX_STORED_IMAGES;
  if (excess <= 0) {
    return 0;
  }

  const oldest = await db.select({ id: image.id }).from(image).orderBy(asc(image.id)).limit(excess);

  const ids = oldest.map((row) => row.id);
  if (ids.length === 0) {
    return 0;
  }

  await db.delete(image).where(inArray(image.id, ids));

  logger.info(
    {
      deleted: ids.length,
      maxStored: MAX_STORED_IMAGES,
      remaining: totalCount - ids.length,
    },
    'pruned stored images',
  );

  return ids.length;
};
