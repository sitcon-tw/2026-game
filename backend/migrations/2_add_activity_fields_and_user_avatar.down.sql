ALTER TABLE "public"."activities"
    DROP COLUMN IF EXISTS "description",
    DROP COLUMN IF EXISTS "link";

ALTER TABLE "public"."users"
    DROP COLUMN IF EXISTS "avatar";
