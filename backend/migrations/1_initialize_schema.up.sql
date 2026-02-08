CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "activities_types" AS ENUM ('booth', 'check', 'challenge');

CREATE TABLE "public"."staffs" (
    "id" uuid NOT NULL,
    "name" text NOT NULL,
    "token" text NOT NULL,
    "created_at" timestamp NOT NULL,
    "updated_at" timestamp NOT NULL,
    CONSTRAINT "pk_staffs_id" PRIMARY KEY ("id")
);
-- Indexes
CREATE UNIQUE INDEX "idx_staffs_token" ON "public"."staffs" ("token");

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

CREATE TABLE "public"."visits" (
    "user_id" uuid NOT NULL,
    "activity_id" uuid NOT NULL,
    "created_at" timestamp NOT NULL,
    CONSTRAINT "pk_visits_user_activity" PRIMARY KEY ("user_id", "activity_id")
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

CREATE TABLE "public"."coupon_histories" (
    "id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "staff_id" uuid NOT NULL,
    "total" integer NOT NULL,
    "used_at" timestamp NOT NULL,
    "created_at" timestamp NOT NULL,
    CONSTRAINT "pk_coupon_histories_id" PRIMARY KEY ("id")
);
-- Indexes
CREATE INDEX "idx_coupon_histories_user_id" ON "public"."coupon_histories" ("user_id");
CREATE INDEX "idx_coupon_histories_staff_id" ON "public"."coupon_histories" ("staff_id");
CREATE INDEX "idx_coupon_histories_used_at" ON "public"."coupon_histories" ("used_at");

-- Foreign key constraints
-- Schema: public
ALTER TABLE "public"."friends" ADD CONSTRAINT "fk_friends_user_id_users_id" FOREIGN KEY("user_id") REFERENCES "public"."users"("id");
ALTER TABLE "public"."friends" ADD CONSTRAINT "fk_friends_friend_id_users_id" FOREIGN KEY("friend_id") REFERENCES "public"."users"("id");
ALTER TABLE "public"."visits" ADD CONSTRAINT "fk_visits_user_id_users_id" FOREIGN KEY("user_id") REFERENCES "public"."users"("id");
ALTER TABLE "public"."visits" ADD CONSTRAINT "fk_visits_activity_id_activities_id" FOREIGN KEY("activity_id") REFERENCES "public"."activities"("id");
ALTER TABLE "public"."discount_coupons" ADD CONSTRAINT "fk_discount_coupons_user_id_users_id" FOREIGN KEY("user_id") REFERENCES "public"."users"("id");
ALTER TABLE "public"."discount_coupons" ADD CONSTRAINT "fk_discount_coupons_used_by_staffs_id" FOREIGN KEY("used_by") REFERENCES "public"."staffs"("id");
ALTER TABLE "public"."coupon_histories" ADD CONSTRAINT "fk_coupon_histories_user_id_users_id" FOREIGN KEY("user_id") REFERENCES "public"."users"("id");
ALTER TABLE "public"."coupon_histories" ADD CONSTRAINT "fk_coupon_histories_staff_id_staffs_id" FOREIGN KEY("staff_id") REFERENCES "public"."staffs"("id");
ALTER TABLE "public"."discount_coupons" ADD CONSTRAINT "fk_discount_coupons_history_id_coupon_histories_id" FOREIGN KEY("history_id") REFERENCES "public"."coupon_histories"("id");
