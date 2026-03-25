"use client";

import { QRCodeSVG } from "qrcode.react";

interface LocalQRCodeProps {
	value: string;
	size: number;
	ariaLabel?: string;
	className?: string;
}

export default function LocalQRCode({ value, size, ariaLabel, className }: LocalQRCodeProps) {
	return (
		<div
			className={className}
			role={ariaLabel ? "img" : undefined}
			aria-label={ariaLabel}
			style={{
				filter: "contrast(1.6) brightness(1.3) saturate(1.2)",
				boxShadow: "0 0 28px rgba(255, 255, 255, 0.6), 0 0 60px rgba(93, 64, 55, 0.15), inset 0 0 0 1px rgba(255,255,255,0.5)",
			}}
		>
			<QRCodeSVG value={value} size={size} bgColor="#FFFFFF" fgColor="#000000" level="M" />
		</div>
	);
}
