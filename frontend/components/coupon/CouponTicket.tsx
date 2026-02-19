"use client";

import { motion } from "motion/react";
import type { DiscountCoupon } from "@/types/api";
import CouponShapeSVG from "./CouponShapeSVG";

export type CouponStatus = "unused" | "used" | "locked";

export default function CouponTicket({
	coupon,
	zIndex,
	status,
	passLevel,
	onClick,
}: {
	coupon?: DiscountCoupon;
	zIndex: number;
	status: CouponStatus;
	passLevel?: number;
	onClick?: () => void;
}) {
	const price = coupon?.price ?? 0;

	const ticketFillColor =
		status === "unused"
			? "var(--accent-gold)"
			: status === "used"
				? "var(--bg-header)"
				: "#3a3a3a";

	const textColor =
		status === "locked" ? "text-gray-500" : "text-white";

	const isClickable = status !== "locked";

	return (
		<motion.div
			className={`relative h-32 w-full max-w-md drop-shadow-lg ${isClickable ? "cursor-pointer" : "cursor-default"}`}
			style={{ zIndex }}
			onClick={isClickable ? onClick : undefined}
			whileTap={isClickable ? { scale: 0.97 } : undefined}
		>
			<div className="relative h-full w-full">
				<CouponShapeSVG fillColor={ticketFillColor} />

				<div className="relative z-10 flex h-full w-full items-center p-4">
					{/* Left Part */}
					<div className="flex flex-[3] items-start">
						<span
							className={`ml-25 font-serif text-5xl italic ${textColor}`}
						>
							{price}
						</span>
						<span className={`mt-6 ml-2 text-lg font-bold ${textColor}`}>
							元
						</span>
					</div>

					{/* Right Part */}
					<div className="flex-[2]" />
				</div>

				{/* Used Stamp */}
				{status === "used" && (
					<div className="absolute inset-0 z-20 flex items-center justify-center">
						<div className="-rotate-12 border-4 border-[var(--status-error)] px-6 py-2">
							<p
								className="text-4xl font-black tracking-wider text-[var(--status-error)]"
								style={{
									fontFamily:
										"Impact, Arial Black, sans-serif",
								}}
							>
								USED
							</p>
						</div>
					</div>
				)}

				{/* Locked Overlay */}
				{status === "locked" && (
					<div className="absolute inset-0 z-20 flex items-center justify-center">
						<div className="flex flex-col items-center gap-1">
							<span className="text-3xl">🔒</span>
							{passLevel !== undefined && (
								<p className="text-xs font-bold text-gray-400">
									通過第 {passLevel} 關解鎖
								</p>
							)}
						</div>
					</div>
				)}
			</div>
		</motion.div>
	);
}
