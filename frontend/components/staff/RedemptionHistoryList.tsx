import { DiscountHistoryItem } from "@/types/api";

interface RedemptionHistoryListProps {
  history: DiscountHistoryItem[];
  isLoading: boolean;
}

export function RedemptionHistoryList({ history, isLoading }: RedemptionHistoryListProps) {
  if (isLoading) {
    return (
      <div className="mt-8 w-full max-w-[300px] text-center text-[var(--text-secondary)]">
        載入核銷紀錄中...
      </div>
    );
  }

  return (
    <div className="mt-8 w-full max-w-[300px]">
      <h2 className="font-serif text-2xl text-[var(--text-primary)] text-center mb-4">
        核銷紀錄
      </h2>
      {history.length === 0 ? (
        <p className="text-center text-[var(--text-secondary)]">尚無核銷紀錄</p>
      ) : (
        <ul>
          {history.map((item) => (
            <li key={item.id} className="border-b border-gray-200 py-2 text-[var(--text-primary)] text-sm">
              <div className="flex justify-between">
                <span>{item.nickname}</span>
                <span>-{item.total} 元</span>
              </div>
              <div className="text-right text-xs text-[var(--text-secondary)]">
                {new Date(item.used_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
