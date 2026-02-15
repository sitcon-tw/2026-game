CREATE TABLE "public"."discount_coupon_gift" (
    "id" uuid NOT NULL,
    "token" text NOT NULL,
    "price" integer NOT NULL,
    "discount_id" text NOT NULL,
    CONSTRAINT "pk_discount_coupon_gift_id" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "idx_discount_coupon_gift_token" ON "public"."discount_coupon_gift" ("token");
