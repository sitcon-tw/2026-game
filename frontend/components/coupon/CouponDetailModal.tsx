"use client";

import { motion } from "motion/react";
import type { DiscountCoupon } from "@/types/api";

export default function CouponDetailModal({
	coupon,
	onClose,
}: {
	coupon: DiscountCoupon;
	onClose: () => void;
}) {
	return (
		<motion.div
			className="fixed inset-0 z-50 flex items-center justify-center px-6"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			onClick={onClose}
		>
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/50" />

			{/* Modal */}
			<motion.div
				className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-[var(--bg-primary)] shadow-2xl"
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.9, opacity: 0 }}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header with amount */}
				<div
					className={`relative flex items-center justify-center py-8 ${
						coupon.used_at
							? "bg-[var(--bg-header)]"
							: "bg-[var(--accent-gold)]"
					}`}
				>
					<span className="font-serif text-6xl italic text-white">
						{coupon.price}
					</span>
					<span className="mt-4 ml-2 text-xl font-bold text-white">
						元
					</span>
					{coupon.used_at && (
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="-rotate-12 border-4 border-[var(--status-error)] px-6 py-2">
								<p
									className="text-4xl font-black tracking-wider text-[var(--status-error)]"
									style={{
										fontFamily:
											"Impact, Arial Black, sans-serif",
									}}
								>
									USED
								</p>
							</div>
						</div>
					)}
				</div>

				{/* Details */}
				<div className="space-y-4 p-6">
					<div>
						<h3 className="text-lg font-bold text-[var(--text-primary)]">
							SITCON 商品折價券
						</h3>
					</div>
					<div>
						<p className="text-xs font-semibold text-[var(--text-secondary)]">
							說明
						</p>
						<p className="mt-1 text-sm text-[var(--text-primary)]">
							可折抵 SITCON 攤位任意商品 {coupon.price}{" "}
							元，限單次使用，不提供分次折抵或找零。
						</p>
					</div>
					<div>
						<p className="text-xs font-semibold text-[var(--text-secondary)]">
							折扣券 ID
						</p>
						<p className="mt-1 text-sm text-[var(--text-primary)]">
							{coupon.discount_id}
						</p>
					</div>
					<div>
						<p className="text-xs font-semibold text-[var(--text-secondary)]">
							狀態
						</p>
						<p
							className={`mt-1 text-sm font-bold ${
								coupon.used_at
									? "text-[var(--status-error)]"
									: "text-[var(--status-success)]"
							}`}
						>
							{coupon.used_at ? "已使用" : "可使用"}
						</p>
					</div>
				</div>

				{/* Close button */}
				<div className="px-6 pb-6">
					<button
						onClick={onClose}
						className="w-full rounded-full bg-[var(--bg-header)] py-3 text-base font-bold tracking-widest text-[var(--text-light)] shadow-md transition-transform active:scale-95"
					>
						關閉
					</button>
				</div>
			</motion.div>
		</motion.div>
	);
}
