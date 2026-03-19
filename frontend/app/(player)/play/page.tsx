"use client";

import UnlockMethodCard from "@/components/unlock/UnlockMethodCard";
import { useActivityStats, useCurrentUser, useFriendCount, useGroupMembers } from "@/hooks/api";
import type { ActivityWithStatus } from "@/types/api";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

export default function PlayPage() {
	const router = useRouter();
	const { data: activities } = useActivityStats();
	const { data: friendData } = useFriendCount();
	const { data: currentUser } = useCurrentUser();
	const hasCompassPlan = !!currentUser?.group;
	const { data: groupMembers } = useGroupMembers(hasCompassPlan);

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
			</div>
		</div>
	);
}
