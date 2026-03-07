import { DiscountHistoryItem } from "@/types/api";

interface RedemptionHistoryListProps {
  history: DiscountHistoryItem[];
  isLoading: boolean;
}

function HistorySkeleton() {
  return (
    <div className="mt-8 w-full max-w-[340px] space-y-3">
      <div className="mx-auto h-7 w-24 animate-pulse rounded-md bg-[var(--border-warm,#E8D5C0)]" />
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl bg-[var(--card-bg,#FFF8F0)] p-4 shadow-sm ring-1 ring-[var(--border-warm,#E8D5C0)]"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-20 rounded bg-[var(--border-warm,#E8D5C0)]" />
            <div className="h-5 w-16 rounded bg-[var(--border-warm,#E8D5C0)]" />
          </div>
          <div className="mt-2 flex justify-end">
            <div className="h-3 w-28 rounded bg-[var(--border-warm,#E8D5C0)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RedemptionHistoryList({
  history,
  isLoading,
}: RedemptionHistoryListProps) {
  if (isLoading) {
    return <HistorySkeleton />;
  }

  return (
    <div className="mt-8 w-full max-w-[340px]">
      <h2 className="mb-4 text-center font-serif text-2xl font-bold text-[var(--text-primary)]">
        核銷紀錄
      </h2>
      {history.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="text-4xl">📋</span>
          <p className="font-serif text-lg text-[var(--text-secondary)]">
            尚無核銷紀錄
          </p>
          <p className="text-sm text-[var(--text-secondary)]/60">
            掃描玩家的折價券 QR Code 開始核銷
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {history.map((item) => (
            <li
              key={item.id}
              className="rounded-xl bg-[var(--card-bg,#FFF8F0)] px-4 py-3 shadow-sm ring-1 ring-[var(--border-warm,#E8D5C0)]"
            >
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-[var(--text-primary)]">
                  {item.nickname}
                </span>
                <span className="font-serif text-lg font-bold text-[#B8860B]">
                  -${item.total}
                </span>
              </div>
              <div className="mt-1 text-right text-xs text-[var(--text-secondary)]">
                {new Date(item.used_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
