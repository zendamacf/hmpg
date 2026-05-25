CREATE TABLE "image" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "image_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"unspashid" text,
	"latitude" numeric,
	"longitude" numeric,
	"location" text,
	"author_name" text,
	"author_instagram" text,
	"url" text,
	CONSTRAINT "image_unspashid_unique" UNIQUE("unspashid")
);
