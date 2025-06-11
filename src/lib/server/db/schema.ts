import { integer, numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const image = sqliteTable('image', {
  id: integer('id').primaryKey(),
  unsplashid: text('unspashid').unique(),
  latitude: numeric('latitude'),
  longitude: numeric('longitude'),
  location: text('location'),
  author_name: text('author_name'),
  author_instagram: text('author_instagram'),
  url: text('url'),
});
