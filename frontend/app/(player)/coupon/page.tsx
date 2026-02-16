"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useCoupons, useRedeemGiftCoupon } from "@/hooks/api";
import type { DiscountCoupon } from "@/types/api";
import CouponTicket from "@/components/coupon/CouponTicket";
import CouponDetailModal from "@/components/coupon/CouponDetailModal";

function RedeemSection() {
	const [showInput, setShowInput] = useState(false);
	const [redeemCode, setRedeemCode] = useState("");
	const [message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);
	const redeemGift = useRedeemGiftCoupon();

	const handleRedeem = () => {
		if (!redeemCode.trim()) return;
		setMessage(null);
		redeemGift.mutate(redeemCode.trim(), {
			onSuccess: () => {
				setRedeemCode("");
				setShowInput(false);
				setMessage({ type: "success", text: "兌換成功！折價券已加入列表" });
			},
			onError: (error: any) => {
				const text =
					error?.response?.data?.message ||
					error?.message ||
					"兌換失敗，請確認代碼是否正確";
				setMessage({ type: "error", text });
			},
		});
	};

	return (
		<div className="flex flex-col items-center gap-2 py-4">
			{message && (
				<p
					className={`text-sm font-medium ${message.type === "success"
						? "text-[var(--status-success)]"
						: "text-[var(--status-error)]"
						}`}
				>
					{message.text}
				</p>
			)}

			<AnimatePresence>
				{showInput && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="flex w-full max-w-sm flex-col items-center gap-3 overflow-hidden px-4"
					>
						<input
							type="text"
							placeholder="輸入兌換代碼"
							value={redeemCode}
							onChange={(e) => setRedeemCode(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
							disabled={redeemGift.isPending}
							className="w-full rounded-full border-none bg-[var(--bg-secondary)] p-3 text-center text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none"
						/>
						<button
							onClick={handleRedeem}
							disabled={redeemGift.isPending || !redeemCode.trim()}
							className="rounded-full bg-[var(--accent-bronze)] px-12 py-3 text-lg font-bold tracking-widest text-[var(--text-light)] shadow-lg transition-transform active:scale-95 disabled:opacity-50"
						>
							{redeemGift.isPending ? "兌換中..." : "兌換"}
						</button>
					</motion.div>
				)}
			</AnimatePresence>

			<button
				onClick={() => {
					setShowInput((v) => !v);
					setMessage(null);
				}}
				className="text-sm text-[var(--text-secondary)] underline underline-offset-2"
			>
				{showInput ? "收起" : "有兌換代碼？"}
			</button>
		</div>
	);
}

export default function CouponPage() {
	const { data: coupons, isLoading } = useCoupons();
	const [selectedCoupon, setSelectedCoupon] = useState<DiscountCoupon | null>(
		null
	);

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
				<RedeemSection />
			</div>
		);
	}

	// Sort: unused first, used last
	const sorted = [...coupons].sort((a, b) => {
		const aUsed = a.used_at ? 1 : 0;
		const bUsed = b.used_at ? 1 : 0;
		return aUsed - bUsed;
	});

	const unusedCount = sorted.filter((c) => !c.used_at).length;

	return (
		<div className="px-6 py-8">
			<div className="text-center">
				{/* Header */}
				<h1 className="text-[var(--text-primary)] text-3xl font-serif font-bold text-center">
					折價券
				</h1>
				<p className="my-3 text-sm font-medium text-[var(--text-primary)]">
					你有{" "}
					<span className="text-lg font-bold text-[var(--bg-header)]">
						{unusedCount}
					</span>{" "}
					張可用折價券
				</p>

				{/* Rules */}
				<div className="mx-auto my-4 flex max-w-xs items-center gap-2 rounded-lg border border-[var(--accent-bronze)]/30 bg-[var(--accent-bronze)]/10 px-4 py-3 text-left text-xs text-[var(--text-primary)]">
					<span className="text-xl">⚠️</span>
					<div className="flex flex-col gap-1">
						<p>
							<span className="font-bold">限時</span>{" "}
							獲得期限僅至 16:00
						</p>
						<p>
							<span className="font-bold">單次</span>{" "}
							每張限用一次，不提供分次折抵
						</p>
					</div>
				</div>

				{/* Coupon Stack */}
				<div className="relative flex flex-col items-center space-y-[-2rem] my-8">
					{sorted.map((coupon, index) => (
						<CouponTicket
							key={coupon.id}
							coupon={coupon}
							zIndex={sorted.length - index}
							onClick={() => setSelectedCoupon(coupon)}
						/>
					))}
				</div>

				{/* Redeem Section */}
				<div className="my-2">
					<RedeemSection />
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
		</div >
	);
}
