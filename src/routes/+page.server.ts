import { asc, inArray, isNotNull, sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { image } from '#lib/server/db/schema.js';
import { logger } from '#lib/server/logger.js';
import { refreshImage } from '#lib/server/refresh-image.js';
import { activeTopics, parseTopicsCookie, TOPICS_COOKIE } from '#lib/topics.js';
import type { PageServerLoad } from './$types';

const PAGE_LOAD_REFRESH_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The tags that photos in the pool have. These are the topics a user can pick. */
const listTopics = async (): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ tag: image.tag })
    .from(image)
    .where(isNotNull(image.tag))
    .orderBy(asc(image.tag));
  return rows.flatMap((row) => (row.tag ? [row.tag] : []));
};

const pickRandomPhoto = async (topics: string[] = []) => {
  const [photo] = await db
    .select()
    .from(image)
    .where(topics.length > 0 ? inArray(image.tag, topics) : undefined)
    .orderBy(sql`RANDOM()`)
    .limit(1);
  return photo ?? null;
};

/** A photo from the chosen topics. When no photo matches, any photo. */
const pickPhoto = async (topics: string[]) =>
  (topics.length > 0 ? await pickRandomPhoto(topics) : null) ?? (await pickRandomPhoto());

export const load: PageServerLoad = async ({ cookies }) => {
  const cookieTopics = parseTopicsCookie(cookies.get(TOPICS_COOKIE));
  const topics = await listTopics();
  const chosen = activeTopics(cookieTopics, topics);

  const existing = await pickPhoto(chosen);
  if (existing) {
    return { photo: existing, topics };
  }

  for (let attempt = 1; attempt <= PAGE_LOAD_REFRESH_ATTEMPTS; attempt++) {
    logger.info({ trigger: 'page-load', attempt }, 'refresh started');
    await refreshImage('page-load');
    const photo = await pickRandomPhoto();
    if (photo) {
      return { photo, topics: await listTopics() };
    }

    if (attempt < PAGE_LOAD_REFRESH_ATTEMPTS) {
      logger.warn({ trigger: 'page-load', attempt }, 'no image after refresh; backing off');
      await sleep(RETRY_BACKOFF_MS * attempt);
    }
  }

  logger.warn({ trigger: 'page-load' }, 'no image available after retries');
  return { photo: null, topics };
};
