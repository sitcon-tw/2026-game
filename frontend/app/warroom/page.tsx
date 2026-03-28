"use client";

import type { RankEntry, RankResponse } from "@/types/api";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

const API_BASE = "/api";
const REFRESH_INTERVAL = 10_000; // 10s auto-refresh

async function fetchLeaderboard(): Promise<RankResponse> {
	const res = await fetch(`${API_BASE}/games/leaderboards?page=1`);
	if (!res.ok) throw new Error(`API error ${res.status}`);
	return res.json();
}

function rankBadge(rank: number) {
	if (rank === 1) return "bg-yellow-400 text-black";
	if (rank === 2) return "bg-gray-300 text-black";
	if (rank === 3) return "bg-amber-600 text-white";
	return "bg-zinc-700 text-zinc-200";
}

function EntryRow({ entry }: { entry: RankEntry }) {
	return (
		<div className="flex items-center gap-4 rounded-xl bg-zinc-800/80 px-5 py-3.5">
			{/* Rank */}
			<span className={`shrink-0 grid h-10 w-10 place-items-center rounded-full text-base font-bold ${rankBadge(entry.rank)}`}>
				{entry.rank}
			</span>

			{/* Avatar */}
			{entry.avatar ? (
				<img src={entry.avatar} alt="" className="h-12 w-12 rounded-full object-cover shrink-0" />
			) : (
				<div className="h-12 w-12 rounded-full bg-zinc-600 flex items-center justify-center font-bold text-base text-zinc-300 shrink-0">
					{entry.nickname.charAt(0)}
				</div>
			)}

			{/* Name */}
			<div className="min-w-0 flex-1 truncate text-lg font-semibold text-zinc-100">
				{entry.nickname}
			</div>

			{/* Level (right-aligned) */}
			<span className="shrink-0 text-2xl font-medium text-zinc-400">Lv.{entry.level}</span>
		</div>
	);
}

export default function WarRoomPage() {
	const [entries, setEntries] = useState<RankEntry[]>([]);
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);
	const [fetching, setFetching] = useState(false);

	const refresh = useCallback(async () => {
		setFetching(true);
		try {
			const data = await fetchLeaderboard();
			setEntries(data.rank.slice(0, 30));
			setLastUpdated(new Date());
			setError(null);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Unknown error");
		} finally {
			setFetching(false);
		}
	}, []);

	useEffect(() => {
		refresh();
		setCountdown(REFRESH_INTERVAL / 1000);
		const refreshId = setInterval(() => {
			refresh();
			setCountdown(REFRESH_INTERVAL / 1000);
		}, REFRESH_INTERVAL);
		const tickId = setInterval(() => {
			setCountdown(prev => (prev > 1 ? prev - 1 : 0));
		}, 1000);
		return () => {
			clearInterval(refreshId);
			clearInterval(tickId);
		};
	}, [refresh]);

	// Sort entries by rank (already sorted from API, but ensure)
	const sorted = [...entries].sort((a, b) => a.rank - b.rank);

	return (
		<div className="min-h-screen bg-zinc-900 px-8 py-8 font-sans text-zinc-100 mx-auto">
			<div className="max-w-screen-md mx-auto">
				{/* Header */}
				<div className="mb-8 flex flex-wrap items-center justify-between gap-4">
					<div>
						<h1 className="text-4xl font-bold tracking-tight">SITCON 2026 War Room</h1>
						<p className="mt-1 text-base text-zinc-400">
							Top 30 Leaderboard
							{lastUpdated && <> &middot; updated at {lastUpdated.toLocaleTimeString("zh-TW")}</>}
							{error && <span className="ml-2 text-red-400">{error}</span>}
						</p>
					</div>
					<div className="flex items-center gap-3">
						<span className="tabular-nums text-base text-zinc-400 text-lg">{countdown}s</span>
						<button
							type="button"
							onClick={() => { refresh(); setCountdown(REFRESH_INTERVAL / 1000); }}
							className="grid h-10 min-w-[100px] place-items-center rounded-lg bg-zinc-700 px-5 text-base font-medium text-zinc-200 transition-colors hover:bg-zinc-600 active:bg-zinc-500 cursor-pointer"
						>
							{fetching ? (
								<span className="flex items-center gap-1.5">
									<motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="inline-block h-2 w-2 rounded-full bg-zinc-300" />
									<motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} className="inline-block h-2 w-2 rounded-full bg-zinc-300" />
									<motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} className="inline-block h-2 w-2 rounded-full bg-zinc-300" />
								</span>
							) : (
								"Refresh"
							)}
						</button>
					</div>
				</div>

				{/* Board */}
				{entries.length === 0 && !error && (
					<div className="flex items-center justify-center gap-2 py-20 text-zinc-500">
						<motion.span
							animate={{ opacity: [0.3, 1, 0.3] }}
							transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
							className="inline-block h-2.5 w-2.5 rounded-full bg-zinc-500"
						/>
						<motion.span
							animate={{ opacity: [0.3, 1, 0.3] }}
							transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
							className="inline-block h-2.5 w-2.5 rounded-full bg-zinc-500"
						/>
						<motion.span
							animate={{ opacity: [0.3, 1, 0.3] }}
							transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
							className="inline-block h-2.5 w-2.5 rounded-full bg-zinc-500"
						/>
						<span className="ml-2 text-base">Thinking...</span>
					</div>
				)}

				<div className="flex flex-col gap-2">
					{sorted.map((entry, idx) => (
						<EntryRow key={`${entry.rank}-${entry.nickname}-${idx}`} entry={entry} />
					))}
				</div>
			</div>
		</div>
	);
}
