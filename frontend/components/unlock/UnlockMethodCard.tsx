"use client";

import Image from "next/image";
import ProgressBar from "@/components/ui/ProgressBar";

interface UnlockMethodCardProps {
  title: string;
  current: number;
  total: number;
  loaded?: boolean;
  onClick: () => void;
}

export default function UnlockMethodCard({
  title,
  current,
  total,
  loaded = false,
  onClick,
}: UnlockMethodCardProps) {
  const isLoading = !loaded;
  const progress = isLoading ? 0 : (current / total) * 100;

  return (
    <button
      onClick={onClick}
      className="grid grid-cols-[auto_1fr_auto] items-center w-full bg-[var(--accent-bronze)] rounded-xl p-6 hover:bg-[#9A6C3B] transition-colors active:scale-[0.98] transition-transform cursor-pointer"
    >
      {/* Left Spacer (same width as arrow) */}
      <div className="w-14" />

      {/* Content */}
      <div className="flex flex-col items-center gap-3">
        {/* Title */}
        <div className="text-[var(--text-light)] text-2xl font-serif font-bold text-center">
          {title}
        </div>

        {/* Progress Bar */}
        <ProgressBar
          percent={progress}
          variant="bronze"
          height="h-3"
          loading={isLoading}
          className="w-40"
        />

        {/* Progress Text */}
        <div className="text-[var(--text-light)] text-xl font-serif text-center">
          {isLoading ? (
            <div className="h-6 w-12 animate-pulse rounded bg-white/20" />
          ) : (
            <span>
              {current}/{total}
            </span>
          )}
        </div>
      </div>

      {/* Arrow Button */}
      <div className="w-14 h-14 flex items-center justify-center">
        <Image
          src="/assets/challenge/arrow-right.svg"
          alt="arrow right"
          width={38}
          height={38}
        />
      </div>
    </button>
  );
}
