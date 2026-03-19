"use client";

import { useGameStore } from "@/stores/gameStore";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

export default function ChallengesLayout({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const { phase, requestPlay, requestHint } = useGameStore();

	const canPlay = phase === "idle" || phase === "fail";
	const canHint = phase === "idle" || phase === "input" || phase === "fail";

	return (
		<div className="flex flex-col h-full bg-[var(--bg-primary)]">
			{/* Top Toggle Bar */}
			<div className="sticky top-0 z-30 flex items-center bg-[var(--bg-header-in-layout)] px-4 py-3">
				{/* Back */}
				<button type="button" onClick={() => (pathname === "/game/rule" ? router.back() : router.push("/game"))} className="relative h-10 w-10 rounded-full cursor-pointer" aria-label="返回">
					<Image src="/assets/challenge/arrow-left.svg" alt="返回" fill className="object-contain" />
				</button>

				{/* Actions Group */}
				<div className="flex flex-1 justify-center gap-4">
					{/* Hint / PlayAgain */}
					<button
						type="button"
						className={`relative h-10 w-10 rounded-full cursor-pointer transition-opacity ${canHint ? "opacity-100" : "opacity-40"}`}
						aria-label="再聽一次"
						disabled={!canHint}
						onClick={requestHint}
					>
						<Image src="/assets/challenge/play.svg" alt="重播" fill className="object-contain" />
					</button>

					{/* Help */}
					<button type="button" className="relative h-10 w-10 rounded-full cursor-pointer" aria-label="說明" onClick={() => router.push("/game/rule")}>
						<Image src="/assets/challenge/help.svg" alt="說明" fill className="object-contain" />
					</button>
				</div>

				{/* Spacer to balance the centered group */}
				<div className="w-10" />
			</div>

			{/* Page Content */}
			{children}
		</div>
	);
}
