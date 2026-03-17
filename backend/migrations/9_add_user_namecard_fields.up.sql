ALTER TABLE "public"."users"
ADD COLUMN "namecard_bio" text,
ADD COLUMN "namecard_links" text[],
ADD COLUMN "namecard_email" text;
