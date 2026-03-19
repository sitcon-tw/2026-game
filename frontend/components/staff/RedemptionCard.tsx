"use client";

import { GetUserCouponsResponse } from "@/types/api";
import { useState } from "react";

interface RedemptionCardProps {
	lookupResult: GetUserCouponsResponse;
	onConfirmRedeem: () => void;
	onCancel: () => void;
	isRedeeming: boolean;
}

export function RedemptionCard({ lookupResult, onConfirmRedeem, onCancel, isRedeeming }: RedemptionCardProps) {
	const [showConfirm, setShowConfirm] = useState(false);

	return (
		<div className="mt-4 w-full max-w-[340px] overflow-hidden rounded-2xl bg-[var(--card-bg,#FFF8F0)] shadow-lg ring-1 ring-[var(--border-warm,#E8D5C0)]">
			{/* Header */}
			<div className="bg-[#59360B] px-5 py-3">
				<h3 className="font-serif text-lg font-bold text-white">折扣券資訊</h3>
			</div>

			{/* Body */}
			<div className="space-y-3 px-5 py-4">
				<div className="flex items-center justify-between">
					<span className="text-sm text-[var(--text-secondary)]">可用張數</span>
					<span className="font-serif text-lg font-bold text-[var(--text-primary)]">{lookupResult.coupons.length} 張</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-sm text-[var(--text-secondary)]">折抵總額</span>
					<span className="font-serif text-2xl font-bold text-[#B8860B]">${lookupResult.total}</span>
				</div>

				{/* Coupon breakdown */}
				{lookupResult.coupons.length > 0 && (
					<div className="space-y-1 border-t border-[var(--border-warm,#E8D5C0)] pt-3">
						<p className="text-xs text-[var(--text-secondary)]">折扣券明細</p>
						{lookupResult.coupons.map(coupon => (
							<div key={coupon.id} className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-1.5 text-sm">
								<span className="text-[var(--text-secondary)]">{coupon.discount_id.slice(0, 8)}…</span>
								<span className="font-bold text-[var(--text-primary)]">${coupon.price}</span>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Actions */}
			<div className="flex gap-3 border-t border-[var(--border-warm,#E8D5C0)] px-5 py-4">
				<button
					type="button"
					onClick={onCancel}
					disabled={isRedeeming}
					className="flex-1 rounded-xl border border-[var(--border-warm,#E8D5C0)] bg-white py-2.5 font-serif text-sm font-bold text-[var(--text-secondary)] transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50"
				>
					取消
				</button>
				{!showConfirm ? (
					<button
						type="button"
						onClick={() => setShowConfirm(true)}
						disabled={isRedeeming}
						className="flex-1 rounded-xl bg-[#59360B] py-2.5 font-serif text-sm font-bold text-white shadow-md transition-colors hover:bg-[#6B4410] active:bg-[#4A2D09] disabled:opacity-50"
					>
						確認核銷
					</button>
				) : (
					<button
						type="button"
						onClick={() => {
							setShowConfirm(false);
							onConfirmRedeem();
						}}
						disabled={isRedeeming}
						className="flex-1 animate-pulse rounded-xl bg-[#B8860B] py-2.5 font-serif text-sm font-bold text-white shadow-md transition-colors hover:bg-[#9A7209] active:bg-[#7D5C07] disabled:animate-none disabled:opacity-50"
					>
						{isRedeeming ? "核銷中..." : "確定？再按一次"}
					</button>
				)}
			</div>
		</div>
	);
}
