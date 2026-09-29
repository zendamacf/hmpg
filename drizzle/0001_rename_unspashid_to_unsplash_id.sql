ALTER TABLE "image" RENAME COLUMN "unspashid" TO "unsplash_id";--> statement-breakpoint
ALTER TABLE "image" RENAME CONSTRAINT "image_unspashid_unique" TO "image_unsplash_id_unique";
