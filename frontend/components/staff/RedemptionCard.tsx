import { GetUserCouponsResponse } from "@/types/api";

interface RedemptionCardProps {
  lookupResult: GetUserCouponsResponse;
  onConfirmRedeem: () => void;
  isRedeeming: boolean;
}

export function RedemptionCard({
  lookupResult,
  onConfirmRedeem,
  isRedeeming,
}: RedemptionCardProps) {
  return (
    <div className="mt-4 rounded-lg bg-white p-4 shadow-md w-full max-w-[300px]">
      <p className="text-sm text-[var(--text-secondary)]">
        可用折扣券: {lookupResult.coupons.length} 張
      </p>
      <p className="text-sm text-[var(--text-secondary)]">
        總折扣金額: {lookupResult.total} 元
      </p>
      <button
        onClick={onConfirmRedeem}
        disabled={isRedeeming}
        className="mt-4 w-full rounded-md bg-green-500 py-2 text-white font-bold disabled:bg-gray-400"
      >
        {isRedeeming ? "核銷中..." : "確認核銷"}
      </button>
    </div>
  );
}
