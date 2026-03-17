ALTER TABLE "public"."users"
DROP COLUMN IF EXISTS "namecard_email",
DROP COLUMN IF EXISTS "namecard_links",
DROP COLUMN IF EXISTS "namecard_bio";
