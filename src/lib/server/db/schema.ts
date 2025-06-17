import { integer, numeric, pgTable, text } from 'drizzle-orm/pg-core';

export const image = pgTable('image', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  unsplashid: text('unspashid').unique(),
  latitude: numeric('latitude'),
  longitude: numeric('longitude'),
  location: text('location'),
  author_name: text('author_name'),
  author_instagram: text('author_instagram'),
  url: text('url'),
});
