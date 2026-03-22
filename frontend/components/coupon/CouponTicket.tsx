"use client";

import type { DiscountCoupon } from "@/types/api";
import { motion } from "motion/react";
import CouponShapeSVG from "./CouponShapeSVG";

export type CouponStatus = "unused" | "used" | "locked";

export default function CouponTicket({
	coupon,
	zIndex,
	status,
	passLevel,
	description,
	onClick,
	price: priceProp
}: {
	coupon?: DiscountCoupon;
	zIndex: number;
	status: CouponStatus;
	passLevel?: number;
	description?: string;
	onClick?: () => void;
	price?: number;
}) {
	const price = priceProp ?? coupon?.price ?? 0;

	const ticketFillColor = status === "unused" ? "var(--accent-gold)" : status === "used" ? "var(--bg-header)" : "#6b6b6b";

	const textColor = status === "locked" ? "text-gray-500" : "text-white";

	return (
		<motion.button
			type="button"
			onClick={onClick}
			className={`relative h-32 w-full max-w-md border-0 bg-transparent p-0 text-left drop-shadow-lg ${onClick ? "cursor-pointer" : "cursor-default"}`}
			style={{ zIndex }}
		>
			<div className="relative h-full w-full">
				<CouponShapeSVG fillColor={ticketFillColor} />

				<div className="relative z-10 flex h-full w-full items-center px-4 pt-4">
					{/* Left Part */}
					<div className="flex flex-[3] flex-col justify-center">
						<div className="flex items-start">
							<span className={`ml-25 font-serif text-5xl italic ${textColor}`}>{price}</span>
							<span className={`mt-6 ml-2 text-lg font-bold ${textColor}`}>元</span>
						</div>
						{description && status !== "locked" && (
							<p className={`ml-25 mt-1 text-xs font-medium ${textColor} opacity-80`}>{description}</p>
						)}
					</div>

					<div className="flex flex-[2]" />
				</div>

				{/* Used Stamp */}
				{status === "used" && (
					<div className="absolute inset-0 z-20 flex items-center justify-center">
						<div className="-rotate-12 border-4 border-[var(--status-error)] px-6 py-2">
							<p
								className="text-4xl font-black tracking-wider text-[var(--status-error)]"
								style={{
									fontFamily: "Impact, Arial Black, sans-serif"
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
							{description ? (
								<p className="text-xs font-bold text-gray-400">{description}</p>
							) : passLevel !== undefined ? (
								<p className="text-xs font-bold text-gray-400">通過第 {passLevel} 關解鎖</p>
							) : null}
						</div>
					</div>
				)}
			</div>
		</motion.button>
	);
}
