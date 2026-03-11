"use client";

export default function CouponError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h2 className="text-xl font-bold text-[var(--text-primary)]">
        無法載入折價券
      </h2>
      <p className="text-sm text-[var(--text-secondary)]">
        發生錯誤，請重新嘗試
      </p>
      <button
        onClick={reset}
        className="rounded-full bg-[var(--accent-gold)] px-8 py-3 text-base font-bold text-white"
      >
        重新載入
      </button>
    </div>
  );
}
