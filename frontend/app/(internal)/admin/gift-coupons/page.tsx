"use client";

import { useState } from "react";
import {
  useAdminGiftCoupons,
  useAdminCreateGiftCoupon,
  useAdminDeleteGiftCoupon,
  useCouponDefinitions,
} from "@/hooks/api";
import type { DiscountCouponGift } from "@/types/api";
import { usePopupStore } from "@/stores";

function CreateGiftCouponForm() {
  const { data: definitions, isLoading: defsLoading } = useCouponDefinitions();
  const createGift = useAdminCreateGiftCoupon();
  const showPopup = usePopupStore((s) => s.showPopup);
  const [discountId, setDiscountId] = useState("");

  const selectedDef = definitions?.find((d) => d.id === discountId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountId || !selectedDef) return;

    createGift.mutate(
      { discount_id: discountId, price: selectedDef.amount },
      {
        onSuccess: () => {
          setDiscountId("");
          showPopup({
            title: "建立成功",
            description: "Gift coupon 已建立",
          });
        },
        onError: (error) => {
          showPopup({
            title: "建立失敗",
            description: `${error?.message ?? "未知錯誤"}，請重新整理頁面後再試`,
          });
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h2 className="font-serif text-lg font-bold text-[var(--text-primary)]">
        新增 Gift Coupon
      </h2>

      <select
        value={discountId}
        onChange={(e) => setDiscountId(e.target.value)}
        className="rounded-lg border-none bg-[var(--bg-secondary)] p-3 text-sm text-[var(--text-primary)]"
      >
        <option value="">
          {defsLoading ? "載入中..." : "選擇折扣券規則"}
        </option>
        {definitions?.map((def) => (
          <option key={def.id} value={def.id}>
            {def.description} (${def.amount})
          </option>
        ))}
      </select>

      {selectedDef && (
        <p className="text-sm text-[var(--text-secondary)]">
          金額：${selectedDef.amount}
        </p>
      )}

      <button
        type="submit"
        disabled={createGift.isPending || !discountId}
        className="rounded-full bg-[var(--accent-bronze)] py-3 text-sm font-bold text-[var(--text-light)] transition-transform active:scale-95 disabled:opacity-50"
      >
        {createGift.isPending ? "建立中..." : "建立"}
      </button>

    </form>
  );
}

function GiftCouponItem({ gift }: { gift: DiscountCouponGift }) {
  const deleteGift = useAdminDeleteGiftCoupon();
  const showPopup = usePopupStore((s) => s.showPopup);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(gift.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-[var(--bg-secondary)] p-4">
      <div className="flex items-center justify-between">
        <span className="font-serif text-lg font-bold text-[var(--text-primary)]">
          ${gift.price}
        </span>
        <button
          onClick={() =>
            deleteGift.mutate(gift.id, {
              onSuccess: () => {
                showPopup({
                  title: "刪除成功",
                  description: "Gift coupon 已刪除",
                });
              },
              onError: (error) => {
                const notFound = error?.message?.includes("not found");
                showPopup({
                  title: "刪除失敗",
                  description: notFound
                    ? "此票券已被兌換，無法刪除。請重新整理頁面"
                    : `${error?.message ?? "未知錯誤"}，請重新整理頁面後再試`,
                });
              },
            })
          }
          disabled={deleteGift.isPending}
          className="rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-700 transition-transform active:scale-95 disabled:opacity-50"
        >
          {deleteGift.isPending ? "..." : "刪除"}
        </button>
      </div>

      <p className="text-xs text-[var(--text-secondary)]">
        Discount ID: {gift.discount_id}
      </p>

      <div className="flex items-center gap-2">
        <code className="flex-1 overflow-hidden text-ellipsis rounded-lg bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)]">
          {gift.token}
        </code>
        <button
          onClick={handleCopy}
          className="shrink-0 rounded-lg bg-[var(--bg-primary)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-transform active:scale-95"
        >
          {copied ? "已複製" : "複製"}
        </button>
      </div>
    </div>
  );
}

export default function GiftCouponsPage() {
  const { data: gifts, isLoading } = useAdminGiftCoupons();

  return (
    <div className="flex flex-col gap-6">
      <CreateGiftCouponForm />

      <div className="flex flex-col gap-3">
        <h2 className="font-serif text-lg font-bold text-[var(--text-primary)]">
          Gift Coupons ({gifts?.length ?? 0})
        </h2>

        {isLoading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl bg-[var(--bg-secondary)]"
              />
            ))}
          </div>
        )}

        {!isLoading && gifts?.length === 0 && (
          <p className="text-sm text-[var(--text-secondary)]">
            尚無 gift coupons
          </p>
        )}

        {gifts?.map((gift) => (
          <GiftCouponItem key={gift.id} gift={gift} />
        ))}
      </div>
    </div>
  );
}
