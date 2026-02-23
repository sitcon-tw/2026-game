CREATE TABLE "public"."announcements" (
    "id" uuid NOT NULL,
    "content" text NOT NULL,
    "created_at" timestamp NOT NULL,
    CONSTRAINT "pk_announcements_id" PRIMARY KEY ("id")
);

CREATE INDEX "idx_announcements_created_at" ON "public"."announcements" ("created_at" DESC);
