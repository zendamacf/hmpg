import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { image } from '$lib/server/db/schema';
import { refreshImage } from '$lib/server/refresh-image';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  let [photo] = await db.select().from(image).orderBy(sql`RANDOM()`).limit(1);

  if (!photo) {
    await refreshImage();
    [photo] = await db.select().from(image).orderBy(sql`RANDOM()`).limit(1);
  }

  return photo;
};
