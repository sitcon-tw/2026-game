-- Remove group_check_ins table and group column from users
DROP TABLE IF EXISTS "public"."group_check_ins";
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "group";
