CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "activities_types" AS ENUM ('booth', 'check', 'challenge');

CREATE TABLE "public"."staff" (
    "id" uuid NOT NULL,
    "name" text NOT NULL,
    "token" text NOT NULL,
    "created_at" timestamp NOT NULL,
    "updated_at" timestamp NOT NULL,
    CONSTRAINT "pk_staff_id" PRIMARY KEY ("id")
);
-- Indexes
CREATE UNIQUE INDEX "idx_staff_token" ON "public"."staff" ("token");

CREATE TABLE "public"."users" (
    "id" uuid NOT NULL,
    "auth_token" text NOT NULL,
    "nickname" text NOT NULL,
    "qrcode_token" text NOT NULL,
    "coupon_token" text NOT NULL,
    "unlock_level" integer NOT NULL,
    "current_level" integer NOT NULL,
    "last_pass_time" timestamp NOT NULL,
    "created_at" timestamp NOT NULL,
    "updated_at" timestamp NOT NULL,
    CONSTRAINT "pk_users_id" PRIMARY KEY ("id")
);
-- Indexes
CREATE UNIQUE INDEX "idx_users_auth_token" ON "public"."users" ("auth_token");
CREATE UNIQUE INDEX "idx_users_qrcode_token" ON "public"."users" ("qrcode_token");
CREATE UNIQUE INDEX "idx_users_coupon_token" ON "public"."users" ("coupon_token");

CREATE TABLE "public"."friends" (
    "user_id" uuid NOT NULL,
    "friend_id" uuid NOT NULL,
    "created_at" timestamp NOT NULL,
    CONSTRAINT "pk_friends_user_friend" PRIMARY KEY ("user_id", "friend_id")
);

CREATE TABLE "public"."activities" (
    "id" uuid NOT NULL,
    "token" text NOT NULL,
    "type" activities_types NOT NULL,
    "qrcode_token" text NOT NULL,
    "name" text NOT NULL,
    "created_at" timestamp NOT NULL,
    "updated_at" timestamp NOT NULL,
    CONSTRAINT "pk_activities_id" PRIMARY KEY ("id")
);
-- Indexes
CREATE UNIQUE INDEX "idx_activities_token" ON "public"."activities" ("token");
CREATE UNIQUE INDEX "idx_activities_qrcode_token" ON "public"."activities" ("qrcode_token");

CREATE TABLE "public"."visited" (
    "user_id" uuid NOT NULL,
    "activity_id" uuid NOT NULL,
    "created_at" timestamp NOT NULL,
    CONSTRAINT "pk_visited_user_activity" PRIMARY KEY ("user_id", "activity_id")
);

CREATE TABLE "public"."discount_coupons" (
    "id" uuid NOT NULL,
    "discount_id" text NOT NULL,
    "user_id" uuid NOT NULL,
    "price" integer NOT NULL,
    "used_by" uuid,
    "used_at" timestamp,
    "history_id" uuid,
    "created_at" timestamp NOT NULL,
    CONSTRAINT "pk_discount_coupons_id_user" PRIMARY KEY ("id", "user_id")
);
-- Indexes
CREATE INDEX "idx_discount_coupons_history_id" ON "public"."discount_coupons" ("history_id");

CREATE TABLE "public"."coupon_history" (
    "id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "staff_id" uuid NOT NULL,
    "total" integer NOT NULL,
    "used_at" timestamp NOT NULL,
    "created_at" timestamp NOT NULL,
    CONSTRAINT "pk_coupon_history_id" PRIMARY KEY ("id")
);
-- Indexes
CREATE INDEX "idx_coupon_history_user_id" ON "public"."coupon_history" ("user_id");
CREATE INDEX "idx_coupon_history_staff_id" ON "public"."coupon_history" ("staff_id");
CREATE INDEX "idx_coupon_history_used_at" ON "public"."coupon_history" ("used_at");

-- Foreign key constraints
-- Schema: public
ALTER TABLE "public"."friends" ADD CONSTRAINT "fk_friends_user_id_users_id" FOREIGN KEY("user_id") REFERENCES "public"."users"("id");
ALTER TABLE "public"."friends" ADD CONSTRAINT "fk_friends_friend_id_users_id" FOREIGN KEY("friend_id") REFERENCES "public"."users"("id");
ALTER TABLE "public"."visited" ADD CONSTRAINT "fk_visited_user_id_users_id" FOREIGN KEY("user_id") REFERENCES "public"."users"("id");
ALTER TABLE "public"."visited" ADD CONSTRAINT "fk_visited_activity_id_activities_id" FOREIGN KEY("activity_id") REFERENCES "public"."activities"("id");
ALTER TABLE "public"."discount_coupons" ADD CONSTRAINT "fk_discount_coupons_user_id_users_id" FOREIGN KEY("user_id") REFERENCES "public"."users"("id");
ALTER TABLE "public"."discount_coupons" ADD CONSTRAINT "fk_discount_coupons_used_by_staff_id" FOREIGN KEY("used_by") REFERENCES "public"."staff"("id");
ALTER TABLE "public"."coupon_history" ADD CONSTRAINT "fk_coupon_history_user_id_users_id" FOREIGN KEY("user_id") REFERENCES "public"."users"("id");
ALTER TABLE "public"."coupon_history" ADD CONSTRAINT "fk_coupon_history_staff_id_staff_id" FOREIGN KEY("staff_id") REFERENCES "public"."staff"("id");
ALTER TABLE "public"."discount_coupons" ADD CONSTRAINT "fk_discount_coupons_history_id_coupon_history_id" FOREIGN KEY("history_id") REFERENCES "public"."coupon_history"("id");
