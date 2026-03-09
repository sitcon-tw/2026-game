CREATE TABLE "public"."staff_qr_coupon_grants" (
    "user_id"     uuid NOT NULL,
    "discount_id" text NOT NULL,
    "staff_id"    uuid NOT NULL,
    "created_at"  timestamp NOT NULL,
    CONSTRAINT "pk_staff_qr_coupon_grants_user_discount" PRIMARY KEY ("user_id", "discount_id")
);

ALTER TABLE "public"."staff_qr_coupon_grants"
    ADD CONSTRAINT "fk_staff_qr_coupon_grants_user_id_users_id"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");

ALTER TABLE "public"."staff_qr_coupon_grants"
    ADD CONSTRAINT "fk_staff_qr_coupon_grants_staff_id_staffs_id"
    FOREIGN KEY ("staff_id") REFERENCES "public"."staffs"("id");

CREATE INDEX "idx_staff_qr_coupon_grants_staff_id" ON "public"."staff_qr_coupon_grants" ("staff_id");
