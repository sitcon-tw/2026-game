"use client";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Modal from "@/components/ui/Modal";
import { useActivityStats } from "@/hooks/api";
import type { ActivityWithStatus } from "@/types/api";
import { useMemo, useState } from "react";
import Markdown from "react-markdown";

export default function CheckinsPage() {
	const { data: activities, isLoading } = useActivityStats();
	const [selectedItem, setSelectedItem] = useState<ActivityWithStatus | null>(null);

	const checkins = useMemo(() => (activities ?? []).filter(a => a.type === "checkin" || a.type === "check"), [activities]);

	if (isLoading) {
		return <LoadingSpinner />;
	}

	return (
		<div className="bg-[var(--bg-primary)] px-6 py-6">
			{/* Title */}
			<h1 className="text-[var(--text-primary)] text-3xl font-serif font-bold text-center mb-6">打卡地點</h1>

			{/* Grid — 2 columns × N rows */}
			<div className="grid grid-cols-2 gap-3">
				{checkins.map(item => (
					<button
						key={item.id}
						type="button"
						onClick={() => setSelectedItem(item)}
						className={`
              flex items-center justify-center px-4 py-5
              font-serif text-xl font-semibold tracking-wide transition-all cursor-pointer
              ${item.visited ? "bg-[var(--accent-bronze)] text-white" : "bg-[#C6A97B] text-[var(--text-light)] opacity-70"}
            `}
					>
						{item.name}
					</button>
				))}
			</div>

			{/* Detail Modal */}
			<Modal open={!!selectedItem} onClose={() => setSelectedItem(null)}>
				{selectedItem && (
					<>
						<h2 className="text-center font-serif text-2xl font-bold text-[var(--text-primary)] mb-2">{selectedItem.name}</h2>
						<p className="text-center text-sm text-[var(--text-secondary)] mb-4">{selectedItem.visited ? "已打卡 ✅" : "尚未到訪 🕐"}</p>
						{selectedItem.description && (
							<div className="prose prose-sm mb-6 max-w-none text-sm text-[var(--text-secondary)] [&_a]:text-[var(--accent-bronze)] [&_a]:underline">
								<Markdown>{selectedItem.description}</Markdown>
							</div>
						)}
						{selectedItem.link && (
							<a
								href={selectedItem.link}
								target="_blank"
								rel="noopener noreferrer"
								className="mb-3 block w-full cursor-pointer rounded-full bg-[var(--accent-bronze)] px-4 py-2.5 text-center text-sm font-semibold text-white"
							>
								前往官網
							</a>
						)}
						<button type="button" onClick={() => setSelectedItem(null)} className="w-full cursor-pointer rounded-full bg-[var(--bg-header)] px-4 py-2.5 text-sm font-semibold text-[var(--text-light)]">
							關閉
						</button>
					</>
				)}
			</Modal>
		</div>
	);
}
