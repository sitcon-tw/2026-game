"use client";

import Modal from "@/components/ui/Modal";
import UnlockMethodCard from "@/components/unlock/UnlockMethodCard";
import { useActivityStats, useCoupons, useCurrentUser, useFriendCount, useGroupMembers } from "@/hooks/api";
import type { ActivityWithStatus } from "@/types/api";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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
					<p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">IG、FB、Threads、X（前身是 Twitter） 的限時動態或貼文分享皆可。</p>
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

export default function PlayPage() {
	const router = useRouter();
	const { data: activities } = useActivityStats();
	const { data: friendData } = useFriendCount();
	const { data: currentUser } = useCurrentUser();
	const hasCompassPlan = !!currentUser?.group;
	const { data: groupMembers } = useGroupMembers(hasCompassPlan);
	const { data: coupons, isLoading: couponsLoading } = useCoupons();
	const [showSnsRule, setShowSnsRule] = useState(false);

	const hasSnsCoupon = useMemo(() => {
		const safeCoupons = Array.isArray(coupons) ? coupons : [];
		return safeCoupons.some(c => c.discount_id === "sitcon-sns-coupon");
	}, [coupons]);

	const counts = useMemo(() => {
		if (!activities)
			return {
				booth: { current: 0, total: 0 },
				challenge: { current: 0, total: 0 },
				checkin: { current: 0, total: 0 }
			};
		const result: Record<"booth" | "challenge" | "checkin", { current: number; total: number }> = {
			booth: { current: 0, total: 0 },
			challenge: { current: 0, total: 0 },
			checkin: { current: 0, total: 0 }
		};
		const typeMap: Record<"booth" | "challenge" | "checkin", ActivityWithStatus["type"][]> = {
			booth: ["booth"],
			challenge: ["challenge"],
			checkin: ["checkin", "check"]
		};

		for (const [key, types] of Object.entries(typeMap) as [keyof typeof typeMap, ActivityWithStatus["type"][]][]) {
			const items = activities.filter(a => types.includes(a.type));
			result[key] = {
				current: items.filter(a => a.visited).length,
				total: items.length
			};
		}
		return result;
	}, [activities]);

	const compassStats = useMemo(() => {
		const members = groupMembers ?? [];
		return {
			current: members.filter(member => member.checked_in).length,
			total: members.length
		};
	}, [groupMembers]);

	const unlockMethods = [
		{
			title: "攤位",
			current: counts.booth?.current ?? 0,
			total: counts.booth?.total ?? 0,
			loaded: !!activities,
			route: "/play/booths"
		},
		{
			title: "闖關",
			current: counts.challenge?.current ?? 0,
			total: counts.challenge?.total ?? 0,
			loaded: !!activities,
			route: "/play/challenges"
		},
		{
			title: "打卡",
			current: counts.checkin?.current ?? 0,
			total: counts.checkin?.total ?? 0,
			loaded: !!activities,
			route: "/play/checkins"
		},
		{
			title: "認識新朋友",
			current: friendData?.count ?? 0,
			total: friendData?.max ?? 0,
			loaded: !!friendData,
			route: "/play/friends"
		}
	];

	if (hasCompassPlan) {
		unlockMethods.push({
			title: "指南針計畫",
			current: compassStats.current,
			total: compassStats.total,
			loaded: !!groupMembers,
			route: "/play/compass"
		});
	}

	return (
		<div className="bg-[var(--bg-primary)] px-6 py-8">
			{/* Title */}
			<h1 className="text-[var(--text-primary)] text-3xl font-serif font-bold text-center mb-8"> 解鎖關卡的方式</h1>

			{/* Unlock Method Cards */}
			<div className="max-w-[430px] mx-auto space-y-4">
				{unlockMethods.map((method, index) => (
					<UnlockMethodCard key={index} title={method.title} current={method.current} total={method.total} loaded={method.loaded} onClick={() => router.push(method.route)} />
				))}

				{/* SNS sharing challenge */}
				<UnlockMethodCard
					title="分享限動拿折價券"
					current={hasSnsCoupon ? 1 : 0}
					total={1}
					loaded={!couponsLoading}
					onClick={() => setShowSnsRule(true)}
				/>
			</div>

			<SnsCouponRuleModal open={showSnsRule} onClose={() => setShowSnsRule(false)} />
		</div>
	);
}
