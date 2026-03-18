"use client";

import { QRCodeSVG } from "qrcode.react";

interface LocalQRCodeProps {
  value: string;
  size: number;
  ariaLabel?: string;
  className?: string;
}

export default function LocalQRCode({
  value,
  size,
  ariaLabel,
  className,
}: LocalQRCodeProps) {
  return (
    <div
      className={className}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
    >
      <QRCodeSVG
        value={value}
        size={size}
        bgColor="#FFFFFF"
        fgColor="#000000"
        level="M"
      />
    </div>
  );
}
