"use client";

import { motion } from "motion/react";
import type { DiscountCoupon } from "@/types/api";
import CouponShapeSVG from "./CouponShapeSVG";

export default function CouponTicket({
	coupon,
	zIndex,
	onClick,
}: {
	coupon: DiscountCoupon;
	zIndex: number;
	onClick: () => void;
}) {
	const ticketFillColor = coupon.used_at
		? "var(--bg-header)"
		: "var(--accent-gold)";
	const textColor = coupon.used_at ? "text-gray-300" : "text-white";

	return (
		<motion.div
			className="relative h-32 w-full max-w-md cursor-pointer drop-shadow-lg"
			style={{ zIndex }}
			onClick={onClick}
			whileTap={{ scale: 0.97 }}
		>
			<div className="relative h-full w-full">
				<CouponShapeSVG fillColor={ticketFillColor} />

				<div className="relative z-10 flex h-full w-full items-center p-4">
					{/* Left Part */}
					<div className="flex flex-[3] items-start">
						<span
							className={`ml-25 font-serif text-5xl italic ${textColor}`}
						>
							{coupon.price}
						</span>
						<span className="mt-6 ml-2 text-lg font-bold text-white">
							元
						</span>
					</div>

					{/* Right Part */}
					<div className="flex-[2]" />
				</div>

				{/* Used Stamp */}
				{coupon.used_at && (
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
			</div>
		</motion.div>
	);
}
