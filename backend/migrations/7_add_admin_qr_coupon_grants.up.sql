CREATE TABLE "public"."admin_qr_coupon_grants" (
    "user_id" uuid NOT NULL,
    "discount_id" text NOT NULL,
    "created_at" timestamp NOT NULL,
    CONSTRAINT "pk_admin_qr_coupon_grants_user_discount" PRIMARY KEY ("user_id", "discount_id")
);

ALTER TABLE "public"."admin_qr_coupon_grants"
    ADD CONSTRAINT "fk_admin_qr_coupon_grants_user_id_users_id"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");
