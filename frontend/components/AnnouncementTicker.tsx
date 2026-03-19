"use client";

import type { Announcement } from "@/types/api";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface AnnouncementTickerProps {
	announcements: Announcement[];
}

type ScrollPhase = "enter" | "reading" | "scrolling" | "paused" | "exit";

const SCROLL_SPEED = 40; // px per second — slower for readability
const READ_DURATION = 1200; // ms — initial pause to read visible text
const PAUSE_DURATION = 2000; // ms — pause after scroll reaches the end
const FLIP_DURATION = 0.5; // seconds — slightly slower flip for smoother feel

export default function AnnouncementTicker({ announcements }: AnnouncementTickerProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [phase, setPhase] = useState<ScrollPhase>("enter");
	const textRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [overflowWidth, setOverflowWidth] = useState(0);

	const count = announcements.length;

	// Measure overflow when the current announcement changes or after enter
	const measureOverflow = useCallback(() => {
		if (!textRef.current || !containerRef.current) return;
		const textW = textRef.current.scrollWidth;
		const containerW = containerRef.current.clientWidth;
		const overflow = Math.max(0, textW - containerW);
		setOverflowWidth(overflow);
	}, []);

	// Phase machine
	useEffect(() => {
		if (count === 0) return;

		if (phase === "enter") {
			// After enter animation completes, measure overflow then pause to let user read
			const timer = setTimeout(() => {
				measureOverflow();
				setPhase("reading");
			}, FLIP_DURATION * 1000);
			return () => clearTimeout(timer);
		}

		if (phase === "reading") {
			// Initial reading pause — let user read the visible portion before scrolling
			const timer = setTimeout(() => {
				setPhase(overflowWidth > 0 ? "scrolling" : "paused");
			}, READ_DURATION);
			return () => clearTimeout(timer);
		}

		if (phase === "scrolling") {
			// Wait for scroll animation to finish
			const scrollDuration = (overflowWidth / SCROLL_SPEED) * 1000;
			const timer = setTimeout(() => setPhase("paused"), scrollDuration);
			return () => clearTimeout(timer);
		}

		if (phase === "paused") {
			const timer = setTimeout(() => setPhase("exit"), PAUSE_DURATION);
			return () => clearTimeout(timer);
		}

		if (phase === "exit") {
			const timer = setTimeout(() => {
				setCurrentIndex(i => (i + 1) % count);
				setOverflowWidth(0);
				setPhase("enter");
			}, FLIP_DURATION * 1000);
			return () => clearTimeout(timer);
		}
	}, [phase, count, overflowWidth, measureOverflow]);

	if (count === 0) return null;

	const announcement = announcements[currentIndex];
	const scrollDuration = overflowWidth > 0 ? overflowWidth / SCROLL_SPEED : 0;

	return (
		<div ref={containerRef} className="h-8 w-full overflow-hidden">
			<AnimatePresence mode="wait">
				<motion.div
					key={announcement.id}
					initial={{ y: "100%" }}
					animate={phase === "exit" ? { y: "-100%" } : { y: "0%" }}
					transition={{ duration: FLIP_DURATION, ease: "easeInOut" }}
					className="h-full flex items-center"
				>
					<motion.div
						ref={textRef}
						className="whitespace-nowrap text-[clamp(0.875rem,2.8vw,1.125rem)]"
						animate={{
							x: (phase === "scrolling" || phase === "paused" || phase === "exit") && overflowWidth > 0 ? -overflowWidth : 0
						}}
						transition={phase === "scrolling" && overflowWidth > 0 ? { duration: scrollDuration, ease: [0.25, 0, 0.35, 1] } : { duration: 0 }}
					>
						{announcement.content}
					</motion.div>
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
