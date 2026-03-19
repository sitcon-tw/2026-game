"use client";

import type { CouponStatus } from "@/components/coupon/CouponTicket";
import CouponTicket from "@/components/coupon/CouponTicket";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import LocalQRCode from "@/components/ui/LocalQRCode";
import Modal from "@/components/ui/Modal";
import { useCouponDefinitions, useCoupons, useRedeemGiftCoupon } from "@/hooks/api";
import { useUserStore } from "@/stores/userStore";
import type { CouponDefinition, DiscountCoupon } from "@/types/api";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

interface DisplayCoupon {
	status: CouponStatus;
	coupon?: DiscountCoupon;
	price: number;
	passLevel?: number;
	description?: string;
	definitionId: string;
}

function buildDisplayList(definitions: CouponDefinition[], userCoupons: DiscountCoupon[]): DisplayCoupon[] {
	const items: DisplayCoupon[] = [];

	// Map user coupons by discount_id
	const couponsByDefId = new Map<string, DiscountCoupon[]>();
	for (const c of userCoupons) {
		const list = couponsByDefId.get(c.discount_id) ?? [];
		list.push(c);
		couponsByDefId.set(c.discount_id, list);
	}

	const defIds = new Set(definitions.map(d => d.id));

	for (const def of definitions) {
		const owned = couponsByDefId.get(def.id) ?? [];

		if (owned.length > 0) {
			for (const c of owned) {
				items.push({
					status: c.used_at ? "used" : "unused",
					coupon: c,
					price: c.price,
					definitionId: def.id
				});
			}
			continue;
		}

		items.push({
			status: "locked",
			price: def.amount,
			passLevel: def.pass_level,
			description: def.description,
			definitionId: def.id
		});
	}

	// Include coupons not tied to any definition (e.g. gift coupons)
	for (const c of userCoupons) {
		if (!defIds.has(c.discount_id)) {
			items.push({
				status: c.used_at ? "used" : "unused",
				coupon: c,
				price: c.price,
				definitionId: c.discount_id
			});
		}
	}

	// Sort: unused first, then used, then locked
	const order: Record<CouponStatus, number> = {
		unused: 0,
		used: 1,
		locked: 2
	};
	items.sort((a, b) => order[a.status] - order[b.status]);

	return items;
}

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
				const text = error?.response?.data?.message || error?.message || "兌換失敗，請確認代碼是否正確";
				setMessage({ type: "error", text });
			}
		});
	};

	return (
		<div className="flex flex-col items-center gap-2 py-4">
			{message && <p className={`text-sm font-medium ${message.type === "success" ? "text-[var(--status-success)]" : "text-[var(--status-error)]"}`}>{message.text}</p>}

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
							onChange={e => setRedeemCode(e.target.value)}
							onKeyDown={e => e.key === "Enter" && handleRedeem()}
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
					setShowInput(v => !v);
					setMessage(null);
				}}
				className="text-sm text-[var(--text-secondary)] underline underline-offset-2"
			>
				{showInput ? "收起" : "有兌換代碼？"}
			</button>
		</div>
	);
}

function RedeemReceiptModal({ open, totalAmount, couponToken, onClose }: { open: boolean; totalAmount: number; couponToken: string; onClose: () => void }) {
	return (
		<Modal open={open} onClose={onClose} className="w-full max-w-sm overflow-hidden p-0">
			{/* Header */}
			<div className="flex items-center justify-center bg-[var(--accent-gold)] py-8">
				<span className="font-serif text-6xl italic text-white">{totalAmount}</span>
				<span className="mt-4 ml-2 text-xl font-bold text-white">元</span>
			</div>

			{/* Content */}
			<div className="flex flex-col items-center gap-4 p-6">
				<h3 className="text-lg font-bold text-[var(--text-primary)]">折價券兌換明細</h3>
				<p className="text-sm text-[var(--text-secondary)]">可折抵總額共 {totalAmount} 元</p>

				{/* QR Code */}
				<div className="flex flex-col items-center gap-2">
					<p className="text-xs font-semibold text-[var(--text-secondary)]">出示 QR Code 供工作人員掃描</p>
					<div className="rounded-2xl bg-white p-3">
						<LocalQRCode value={couponToken} size={176} ariaLabel="Coupon QR Code" className="h-44 w-44" />
					</div>
				</div>

				{/* Location info */}
				<p className="text-sm font-medium text-[var(--text-secondary)]">請至 2F 紀念品攤位使用</p>
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
		</Modal>
	);
}

export default function CouponPage() {
	const { data: coupons, isLoading: couponsLoading } = useCoupons();
	const { data: definitions, isLoading: defsLoading } = useCouponDefinitions();
	const user = useUserStore(state => state.user);
	const [showReceipt, setShowReceipt] = useState(false);

	if (couponsLoading || defsLoading) {
		return <LoadingSpinner />;
	}

	const safeDefinitions = Array.isArray(definitions) ? definitions : [];
	const safeCoupons = Array.isArray(coupons) ? coupons : [];
	const displayList = buildDisplayList(safeDefinitions, safeCoupons);

	const unusedCount = displayList.filter(d => d.status === "unused").length;
	const totalUnusedAmount = displayList.filter(d => d.status === "unused").reduce((sum, d) => sum + d.price, 0);

	return (
		<div className="px-6 py-8">
			<div className="text-center">
				{/* Header */}
				<h1 className="text-center font-serif text-3xl font-bold text-[var(--text-primary)]">折價券</h1>
				<p className="my-3 text-sm font-medium text-[var(--text-primary)]">
					你有 <span className="text-lg font-bold text-[var(--bg-header)]">{unusedCount}</span> 張可用折價券
				</p>

				{/* Rules */}
				<div className="mx-auto my-4 flex max-w-xs items-center rounded-lg border border-[var(--accent-bronze)]/30 bg-[var(--accent-bronze)]/10 px-4 py-3 text-left text-xs text-[var(--text-primary)]">
					<div className="flex flex-col gap-1">
						<p>
							<span className="font-bold">限時</span> 獲得期限僅至 16:00
						</p>
						<p>
							<span className="font-bold">使用</span> 折價券使用至 16:30 收攤
						</p>
						<p>
							<span className="font-bold">門檻</span> 單筆消費滿 200 元才能折抵
						</p>
						<p>
							<span className="font-bold">單次</span> 每張限用一次，且使用時會折抵當下獲得的所有折價券
						</p>
					</div>
				</div>

				{/* Coupon Stack */}
				<div className="relative my-8 flex flex-col items-center space-y-[-2rem]">
					{displayList.map((item, index) => (
						<CouponTicket
							key={item.coupon?.id ?? `${item.definitionId}-locked-${index}`}
							coupon={item.coupon}
							status={item.status}
							price={item.price}
							passLevel={item.passLevel}
							description={item.description}
							zIndex={displayList.length - index}
						/>
					))}
				</div>

				{/* Redeem Button */}
				{unusedCount > 0 && user?.coupon_token && (
					<div className="my-4 flex flex-col items-center gap-2">
						<button
							onClick={() => setShowReceipt(true)}
							className="rounded-full bg-[var(--accent-gold)] px-12 py-3 text-lg font-bold tracking-widest text-white shadow-lg transition-transform active:scale-95"
						>
							兌換折價券
						</button>
						<p className="text-xs text-[var(--text-secondary)]">請至 2F 紀念品攤位使用</p>
					</div>
				)}

				{/* Redeem Code Section */}
				<div className="my-2">
					<RedeemSection />
				</div>
			</div>

			{/* Receipt Modal */}
			<RedeemReceiptModal open={showReceipt && !!user?.coupon_token} totalAmount={totalUnusedAmount} couponToken={user?.coupon_token ?? ""} onClose={() => setShowReceipt(false)} />
		</div>
	);
}
