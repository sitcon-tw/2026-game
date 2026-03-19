"use client";

import ProgressBar from "@/components/ui/ProgressBar";
import { useCurrentUser, useLeaderboard } from "@/hooks/api";

export default function Header() {
	const { data: user } = useCurrentUser();
	const { data: leaderboard } = useLeaderboard();

	const currentLevel = user?.current_level ?? 0;
	const unlockLevel = user?.unlock_level ?? 0;
	const progressPercent = unlockLevel > 0 ? (currentLevel / unlockLevel) * 100 : 0;
	const rank = leaderboard?.me?.rank;

	return (
		<header className="sticky top-0 z-40 h-[var(--header-height)] bg-[var(--bg-header)]">
			<div className="relative flex h-full flex-col justify-center px-6">
				<div className="flex items-center justify-between gap-4">
					<div className="flex flex-[2] flex-col gap-1">
						<div className="text-[var(--text-gold)] font-serif text-xl font-semibold tracking-wide">SITCON 大地遊戲</div>
						<div className="font-serif text-lg">
							{rank != null ? <span className="text-[var(--text-light)]/90">第 {rank} 名</span> : <div className="h-5 w-20 animate-pulse rounded bg-white/20" />}
						</div>
					</div>
					<div className="flex flex-[1] flex-col items-center gap-2">
						<div className="text-[var(--text-light)]/90 font-serif text-lg">
							{user ? (
								<span>
									{currentLevel}/{unlockLevel} 關
								</span>
							) : (
								<div className="h-5 w-16 animate-pulse rounded bg-white/20" />
							)}
						</div>
						<ProgressBar percent={progressPercent} variant="light" loading={!user} className="w-full" />
					</div>
				</div>
			</div>
		</header>
	);
}
