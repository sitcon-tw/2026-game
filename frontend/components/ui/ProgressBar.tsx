"use client";

const variants = {
	/** On dark bronze backgrounds (e.g. UnlockMethodCard) */
	bronze: {
		track: "bg-[#D7994A]",
		fill: "bg-[#945B17]"
	},
	/** On dark header backgrounds */
	light: {
		track: "bg-white",
		fill: "bg-[var(--accent-gold)]"
	},
	/** On light/paper backgrounds (e.g. scan page) */
	subtle: {
		track: "bg-[rgba(93,64,55,0.15)]",
		fill: "bg-[var(--text-primary)]"
	}
} as const;

type Variant = keyof typeof variants;

interface ProgressBarProps {
	/** 0–100 */
	percent: number;
	variant?: Variant;
	/** Tailwind height class, default "h-2.5" */
	height?: string;
	/** Show pulse animation (loading state) */
	loading?: boolean;
	className?: string;
}

export default function ProgressBar({ percent, variant = "subtle", height = "h-2.5", loading = false, className = "" }: ProgressBarProps) {
	const { track, fill } = variants[variant];

	return (
		<div className={`${height} overflow-hidden rounded-full ${track}${loading ? " animate-pulse" : ""} ${className}`}>
			{!loading && <div className={`h-full rounded-full ${fill} transition-all duration-300`} style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }} />}
		</div>
	);
}
