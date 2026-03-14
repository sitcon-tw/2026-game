-- Add group field to users (nullable)
ALTER TABLE "public"."users" ADD COLUMN "group" text;

-- Create group_check_ins table to record bidirectional check-ins within a group
-- We store (user_id, target_id) where user_id < target_id to avoid duplicates,
-- but to simplify queries we store both directions via a canonical pair enforced by CHECK constraint.
CREATE TABLE "public"."group_check_ins" (
    "user_a_id" uuid NOT NULL,
    "user_b_id" uuid NOT NULL,
    "created_at" timestamp NOT NULL,
    CONSTRAINT "pk_group_check_ins" PRIMARY KEY ("user_a_id", "user_b_id"),
    CONSTRAINT "chk_group_check_ins_order" CHECK ("user_a_id" < "user_b_id")
);

-- Foreign key constraints
ALTER TABLE "public"."group_check_ins" ADD CONSTRAINT "fk_group_check_ins_user_a_users_id" FOREIGN KEY("user_a_id") REFERENCES "public"."users"("id");
ALTER TABLE "public"."group_check_ins" ADD CONSTRAINT "fk_group_check_ins_user_b_users_id" FOREIGN KEY("user_b_id") REFERENCES "public"."users"("id");

-- Index for fast lookup by either user
CREATE INDEX "idx_group_check_ins_user_a_id" ON "public"."group_check_ins" ("user_a_id");
CREATE INDEX "idx_group_check_ins_user_b_id" ON "public"."group_check_ins" ("user_b_id");
