import { db } from '$lib/server/db';
import { image } from '$lib/server/db/schema';
import type { Config } from '@sveltejs/adapter-vercel';
import { sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const [photo] = await db
    .select()
    .from(image)
    .orderBy(sql`RANDOM()`)
    .limit(1);
  return photo;
};

export const config: Config = {
  runtime: 'nodejs22.x',
};
