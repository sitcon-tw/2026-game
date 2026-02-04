CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "activities_types" AS ENUM ('booth', 'check', 'challenge');

CREATE TABLE "public"."users" (
    "id" text NOT NULL,
    "nickname" text NOT NULL,
    "qrcode_token" text NOT NULL,
    "unlock_level" integer NOT NULL,
    "current_level" integer NOT NULL,
    "last_pass_time" timestamp NOT NULL,
    "created_at" timestamp NOT NULL,
    "updated_at" timestamp NOT NULL,
    CONSTRAINT "pk_table_1_id" PRIMARY KEY ("id")
);
-- Indexes
CREATE UNIQUE INDEX "users_index_2" ON "public"."users" ("qrcode_token");

CREATE TABLE "public"."friends" (
    "user_id" text NOT NULL,
    "friend_id" text NOT NULL,
    "created_at" timestamp NOT NULL,
    CONSTRAINT "pk_table_3_id" PRIMARY KEY ("user_id", "friend_id")
);

CREATE TABLE "public"."activities" (
    "id" text NOT NULL,
    "type" activities_types NOT NULL,
    "qrcode_token" text NOT NULL,
    "name" text NOT NULL,
    "created_at" timestamp NOT NULL,
    "updated_at" timestamp NOT NULL,
    CONSTRAINT "pk_table_4_id" PRIMARY KEY ("id")
);
-- Indexes
CREATE UNIQUE INDEX "activities_index_2" ON "public"."activities" ("qrcode_token");

CREATE TABLE "public"."visted" (
    "user_id" text NOT NULL,
    "activity_id" text NOT NULL,
    "created_at" timestamp NOT NULL,
    CONSTRAINT "pk_table_5_id" PRIMARY KEY ("user_id", "activity_id")
);

CREATE TABLE "public"."discount_coupons" (
    "id" text NOT NULL,
    "token" text NOT NULL,
    "user_id" text NOT NULL,
    "price" integer NOT NULL,
    "used_at" timestamp NOT NULL,
    "created_at" timestamp NOT NULL,
    CONSTRAINT "pk_table_5_id" PRIMARY KEY ("id", "user_id")
);
-- Indexes
CREATE UNIQUE INDEX "discount_coupons_index_2" ON "public"."discount_coupons" ("token");

-- Foreign key constraints
-- Schema: public
ALTER TABLE "public"."friends" ADD CONSTRAINT "fk_friends_user_id_users_id" FOREIGN KEY("user_id") REFERENCES "public"."users"("id");
ALTER TABLE "public"."friends" ADD CONSTRAINT "fk_friends_friend_id_users_id" FOREIGN KEY("friend_id") REFERENCES "public"."users"("id");
ALTER TABLE "public"."visted" ADD CONSTRAINT "fk_visted_user_id_users_id" FOREIGN KEY("user_id") REFERENCES "public"."users"("id");
ALTER TABLE "public"."visted" ADD CONSTRAINT "fk_visted_activity_id_activities_id" FOREIGN KEY("activity_id") REFERENCES "public"."activities"("id");
ALTER TABLE "public"."discount_coupons" ADD CONSTRAINT "fk_discount_coupons_user_id_users_id" FOREIGN KEY("user_id") REFERENCES "public"."users"("id");