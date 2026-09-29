import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { image } from '$lib/server/db/schema';
import { logger } from '$lib/server/logger';
import { refreshImage } from '$lib/server/refresh-image';
import type { PageServerLoad } from './$types';

const PAGE_LOAD_REFRESH_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const pickRandomPhoto = async () => {
  const [photo] = await db.select().from(image).orderBy(sql`RANDOM()`).limit(1);
  return photo ?? null;
};

export const load: PageServerLoad = async () => {
  const existing = await pickRandomPhoto();
  if (existing) {
    return { photo: existing };
  }

  for (let attempt = 1; attempt <= PAGE_LOAD_REFRESH_ATTEMPTS; attempt++) {
    logger.info({ trigger: 'page-load', attempt }, 'refresh started');
    await refreshImage('page-load');
    const photo = await pickRandomPhoto();
    if (photo) {
      return { photo };
    }

    if (attempt < PAGE_LOAD_REFRESH_ATTEMPTS) {
      logger.warn({ trigger: 'page-load', attempt }, 'no image after refresh; backing off');
      await sleep(RETRY_BACKOFF_MS * attempt);
    }
  }

  logger.warn({ trigger: 'page-load' }, 'no image available after retries');
  return { photo: null };
};
