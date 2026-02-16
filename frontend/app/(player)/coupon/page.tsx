"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { useCoupons } from "@/hooks/api";
import type { DiscountCoupon } from "@/types/api";
import CouponTicket from "@/components/coupon/CouponTicket";
import CouponDetailModal from "@/components/coupon/CouponDetailModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function CouponPage() {
	const { data: coupons, isLoading } = useCoupons();
	const [selectedCoupon, setSelectedCoupon] = useState<DiscountCoupon | null>(
		null
	);
	const [redeemCode, setRedeemCode] = useState("");

	if (isLoading) {
		return <LoadingSpinner />;
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
		<div className="relative w-full overflow-hidden">
			<div className="mx-auto max-w-md pt-16 text-center">
				{/* Title */}
				<h1 className="text-4xl font-bold tracking-[0.4em] text-[var(--text-primary)]">
					折價券
				</h1>
				<p className="mt-2 text-xs text-[var(--text-primary)]">
					折價券獲得期限僅至 16:00！把握機會獲得更多折扣；
				</p>
				<p className="text-xs font-bold text-[var(--text-primary)]">
					折價券限單次使用，不提供分次折抵。
				</p>

				{/* Subtitle */}
				<h2 className="mt-8 text-lg font-bold text-[var(--text-primary)]">
					商品折價券
				</h2>

				{/* Tap hint */}
				<p className="mt-2 animate-pulse text-xs text-[var(--text-secondary)]">
					點擊折價券查看詳細內容
				</p>

				{/* Coupon Stack */}
				<div className="relative mt-4 flex flex-col items-center space-y-[-2rem] pb-24">
					{coupons.map((coupon, index) => (
						<CouponTicket
							key={coupon.id}
							coupon={coupon}
							zIndex={coupons.length - index}
							onClick={() => setSelectedCoupon(coupon)}
						/>
					))}
				</div>

				{/* Redeem Code Input */}
				<div className="flex w-full flex-col items-center gap-4 px-4 pb-16">
					<div className="flex w-full max-w-sm rounded-full shadow-md">
						<input
							type="text"
							placeholder="輸入兌換代碼"
							value={redeemCode}
							onChange={(e) => setRedeemCode(e.target.value)}
							className="flex-grow rounded-full border-none bg-[var(--bg-secondary)] p-3 text-center text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none"
						/>
					</div>
					<button className="rounded-full bg-[var(--bg-header)] px-12 py-3 text-lg font-bold tracking-widest text-[var(--text-light)] shadow-lg transition-transform active:scale-95">
						兌換
					</button>
				</div>
			</div>

			{/* Coupon Detail Modal */}
			<AnimatePresence>
				{selectedCoupon && (
					<CouponDetailModal
						coupon={selectedCoupon}
						onClose={() => setSelectedCoupon(null)}
					/>
				)}
			</AnimatePresence>
		</div>
	);
}
