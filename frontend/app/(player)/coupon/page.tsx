"use client";

import type { CouponStatus } from "@/components/coupon/CouponTicket";
import CouponTicket from "@/components/coupon/CouponTicket";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import LocalQRCode from "@/components/ui/LocalQRCode";
import Modal from "@/components/ui/Modal";
import { useCouponDefinitions, useCoupons, useRedeemGiftCoupon } from "@/hooks/api";
import { ApiError } from "@/lib/api";
import { usePopupStore } from "@/stores";
import { useUserStore } from "@/stores/userStore";
import type { CouponDefinition, DiscountCoupon } from "@/types/api";
import { Clock, Info, ShoppingBag, Ticket, Trophy, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const SNS_COUPON_ID = "sitcon-sns-coupon";

interface DisplayCoupon {
	status: CouponStatus;
	coupon?: DiscountCoupon;
	price: number;
	passLevel?: number;
	description?: string;
	definitionId: string;
}

function getCouponLabel(definitionId: string, description?: string) {
	const trimmedDescription = description?.trim();
	return trimmedDescription || definitionId;
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
					description: getCouponLabel(def.id, def.description),
					definitionId: def.id
				});
			}
			continue;
		}

		items.push({
			status: "locked",
			price: def.amount,
			passLevel: def.pass_level,
			description: getCouponLabel(def.id, def.description),
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
				description: getCouponLabel(c.discount_id),
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
	const redeemGift = useRedeemGiftCoupon();
	const showPopup = usePopupStore(s => s.showPopup);

	const handleRedeem = () => {
		if (!redeemCode.trim()) return;
		redeemGift.mutate(redeemCode.trim(), {
			onSuccess: () => {
				setRedeemCode("");
				setShowInput(false);
				showPopup({
					title: "兌換成功！",
					description: "折價券已加入列表",
					cta: { name: "查看折價券", link: "/coupon" }
				});
			},
			onError: (error: Error) => {
				const text = error instanceof ApiError ? error.data.message || error.message : error.message || "兌換失敗，請確認代碼是否正確";
				showPopup({
					title: "兌換失敗",
					description: text
				});
			}
		});
	};

	return (
		<div className="flex flex-col items-center gap-2 py-4">
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

			<button onClick={() => setShowInput(v => !v)} className="text-sm text-[var(--text-secondary)] underline underline-offset-2">
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

function SnsCouponRuleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
	return (
		<Modal open={open} onClose={onClose} className="w-full max-w-sm overflow-hidden p-0">
			<div className="bg-[var(--accent-gold)] px-6 py-5 text-white">
				<h3 className="text-lg font-bold">限時動態或貼文分享兌換方式</h3>
				<p className="mt-1 text-sm text-white/90">完成分享後，請至指定地點出示畫面兌換。</p>
			</div>

			<div className="space-y-4 px-6 py-5 text-left">
				<div className="rounded-xl bg-[var(--accent-bronze)]/10 px-4 py-3">
					<p className="text-sm font-semibold text-[var(--text-primary)]">打卡平台</p>
					<p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">IG、FB、Threads、X 的限時動態或貼文分享皆可。</p>
				</div>
				<div className="rounded-xl bg-[var(--accent-bronze)]/10 px-4 py-3">
					<p className="text-sm font-semibold text-[var(--text-primary)]">成功條件</p>
					<p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">內容需提及 @sitcon.tw 並 Tag #SITCON2026，才算分享成功。</p>
				</div>
				<div className="rounded-xl bg-[var(--accent-bronze)]/10 px-4 py-3">
					<p className="text-sm font-semibold text-[var(--text-primary)]">兌換時間</p>
					<p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">10:00-12:00</p>
				</div>
				<div className="rounded-xl bg-[var(--accent-bronze)]/10 px-4 py-3">
					<p className="text-sm font-semibold text-[var(--text-primary)]">兌換地點</p>
					<p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">請至 2F 議程組服務台，向工作人員出示你的限時動態或貼文分享畫面兌換。</p>
				</div>
			</div>

			<div className="px-6 pb-6">
				<button
					onClick={onClose}
					className="w-full rounded-full bg-[var(--bg-header)] py-3 text-base font-bold tracking-widest text-[var(--text-light)] shadow-md transition-transform active:scale-95"
				>
					知道了
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
	const [showSnsRule, setShowSnsRule] = useState(false);

	if (couponsLoading || defsLoading) {
		return <LoadingSpinner />;
	}

	const safeDefinitions = Array.isArray(definitions) ? definitions : [];
	const safeCoupons = Array.isArray(coupons) ? coupons : [];
	const displayList = buildDisplayList(safeDefinitions, safeCoupons);
	const hasSnsCoupon = displayList.some(item => item.definitionId === SNS_COUPON_ID);

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
				<div className="mx-auto my-4 grid max-w-xs grid-cols-2 gap-2">
					<div className="flex items-start gap-2 rounded-lg bg-[var(--accent-bronze)]/10 px-3 py-2.5 text-left">
						<Zap size={14} className="mt-0.5 shrink-0 text-[var(--accent-bronze)]" />
						<p className="text-xs text-[var(--text-primary)]">
							<span className="font-bold">限時動態或貼文分享</span>
							<br />
							10:00–12:00
						</p>
					</div>
					<div className="flex items-start gap-2 rounded-lg bg-[var(--accent-bronze)]/10 px-3 py-2.5 text-left">
						<Trophy size={14} className="mt-0.5 shrink-0 text-[var(--accent-bronze)]" />
						<p className="text-xs text-[var(--text-primary)]">
							<span className="font-bold">排行榜結算</span>
							<br />
							16:00
						</p>
					</div>
					<div className="flex items-start gap-2 rounded-lg bg-[var(--accent-bronze)]/10 px-3 py-2.5 text-left">
						<Clock size={14} className="mt-0.5 shrink-0 text-[var(--accent-bronze)]" />
						<p className="text-xs text-[var(--text-primary)]">
							<span className="font-bold">獲得期限</span>
							<br />至 16:00
						</p>
					</div>
					<div className="flex items-start gap-2 rounded-lg bg-[var(--accent-bronze)]/10 px-3 py-2.5 text-left">
						<ShoppingBag size={14} className="mt-0.5 shrink-0 text-[var(--accent-bronze)]" />
						<p className="text-xs text-[var(--text-primary)]">
							<span className="font-bold">使用期限</span>
							<br />至 16:30 收攤
						</p>
					</div>
					<div className="flex items-start gap-2 rounded-lg bg-[var(--accent-bronze)]/10 px-3 py-2.5 text-left">
						<Ticket size={14} className="mt-0.5 shrink-0 text-[var(--accent-bronze)]" />
						<p className="text-xs text-[var(--text-primary)]">
							<span className="font-bold">門檻</span>
							<br />
							單筆滿 200 元折抵
						</p>
					</div>
					<div className="flex items-start gap-2 rounded-lg bg-[var(--accent-bronze)]/10 px-3 py-2.5 text-left">
						<Info size={14} className="mt-0.5 shrink-0 text-[var(--accent-bronze)]" />
						<p className="text-xs text-[var(--text-primary)]">
							<span className="font-bold">單次使用</span>
							<br />
							折抵所有折價券
						</p>
					</div>
				</div>
				<div className="mx-auto max-w-xs rounded-lg border border-[var(--accent-bronze)]/20 bg-[var(--accent-bronze)]/5 px-4 py-3 text-left">
					<p className="text-xs font-medium text-[var(--text-primary)]">
						<span className="font-bold">使用提醒</span>
						<br />
						折價券限本人使用，不可與他人共用
					</p>
				</div>
				{hasSnsCoupon && (
					<button
						type="button"
						onClick={() => setShowSnsRule(true)}
						className="mx-auto mt-3 flex max-w-xs items-center justify-center gap-2 rounded-lg border border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/10 px-4 py-3 text-center text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--accent-gold)]/15"
					>
						<Info size={14} className="shrink-0 text-[var(--accent-bronze)]" />
						查看限時動態或貼文分享兌換規則
					</button>
				)}

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
							onClick={item.definitionId === SNS_COUPON_ID ? () => setShowSnsRule(true) : undefined}
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
			<SnsCouponRuleModal open={showSnsRule} onClose={() => setShowSnsRule(false)} />
		</div>
	);
}
