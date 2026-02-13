"use client";

import { useCoupons } from "@/hooks/api";

export default function CouponPage() {
    const { data: coupons, isLoading } = useCoupons();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20 text-[var(--text-secondary)]">
                載入中...
            </div>
        );
    }

    if (!coupons || coupons.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <p className="text-[var(--text-secondary)] text-lg font-serif">
                    目前還沒有折價券
                </p>
                <p className="text-[var(--text-secondary)] text-sm">
                    繼續闖關就有機會獲得！
                </p>
            </div>
        );
    }

    return (
        <div className="px-5 pb-10 pt-6">
            <h1 className="font-serif text-3xl font-bold text-[var(--text-primary)] text-center mb-6">
                折價券
            </h1>

            <div className="space-y-4">
                {coupons.map((coupon) => (
                    <div
                        key={coupon.id}
                        className={`relative rounded-2xl p-5 shadow-sm ${
                            coupon.used_at
                                ? "bg-[var(--bg-secondary)]/50 opacity-60"
                                : "bg-white"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-serif text-xl font-bold text-[var(--text-primary)]">
                                    ${coupon.price}
                                </p>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {coupon.discount_id}
                                </p>
                            </div>
                            {coupon.used_at && (
                                <span className="rounded-full bg-[var(--status-error)]/20 px-3 py-1 text-sm font-semibold text-[var(--status-error)]">
                                    已使用
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}