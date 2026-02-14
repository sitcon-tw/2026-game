ALTER TABLE "public"."activities"
    ADD COLUMN "link" text,
    ADD COLUMN "description" text;

ALTER TABLE "public"."users"
    ADD COLUMN "avatar" text;
