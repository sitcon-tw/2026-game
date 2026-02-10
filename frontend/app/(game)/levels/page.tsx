import Link from "next/link";

const TOTAL_LEVELS = 40;
const UNLOCKED_LEVELS = 12;
const COMPLETED_LEVELS = 7;

const completedSet = new Set(
    Array.from({ length: COMPLETED_LEVELS }, (_, index) => index + 1)
);

const unlockedLevels = Array.from({ length: UNLOCKED_LEVELS }, (_, index) =>
    index + 1
);

const progressPercent = Math.round(
    (COMPLETED_LEVELS / UNLOCKED_LEVELS) * 100
);

function LevelNoteIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 65 65"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <path
                d="M27.0833 56.875C24.1042 56.875 21.5538 55.8142 19.4323 53.6927C17.3108 51.5712 16.25 49.0208 16.25 46.0417C16.25 43.0625 17.3108 40.5122 19.4323 38.3906C21.5538 36.2691 24.1042 35.2083 27.0833 35.2083C28.1215 35.2083 29.0807 35.3325 29.9609 35.5807C30.8411 35.829 31.6875 36.2014 32.5 36.6979V8.125H48.75V18.9583H37.9167V46.0417C37.9167 49.0208 36.8559 51.5712 34.7344 53.6927C32.6128 55.8142 30.0625 56.875 27.0833 56.875Z"
                fill="currentColor"
            />
        </svg>
    );
}

export default function LevelsPage() {
    return (
        <div className="px-5 pb-10 pt-6">
            <section className="rounded-[20px] bg-[var(--bg-secondary)]/70 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[var(--text-secondary)]">
                        目前排名
                    </div>
                    <div className="font-serif text-2xl text-[var(--text-gold)]">
                        第 10 名
                    </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-sm text-[var(--text-secondary)]">
                        已完成關卡 / 已解鎖關卡
                    </div>
                    <div className="font-serif text-lg text-[var(--text-primary)]">
                        {COMPLETED_LEVELS}/{UNLOCKED_LEVELS}
                    </div>
                </div>
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.7)]">
                    <div
                        className="h-full rounded-full bg-[var(--accent-gold)]"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <div className="mt-2 text-xs text-[var(--text-secondary)]">
                    目前解鎖 {UNLOCKED_LEVELS} 關 / 全部 {TOTAL_LEVELS} 關
                </div>
            </section>

            <section className="mt-6">
                <div className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">
                    已解鎖關卡
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {unlockedLevels.map((level) => {
                        const isCompleted = completedSet.has(level);
                        const iconOpacity = isCompleted
                            ? "opacity-100"
                            : "opacity-55";

                        return (
                            <Link
                                key={level}
                                href={`/game/${level}`}
                                className="group flex flex-col items-center gap-2"
                                aria-label={`第 ${level} 關${isCompleted ? "，可重新挑戰" : ""}`}
                            >
                                <div className={`relative h-16 w-16 ${iconOpacity}`}>
                                    <LevelNoteIcon className="h-full w-full text-[var(--text-primary)]" />
                                    <span className="absolute -top-1 left-1 text-sm font-semibold text-[var(--text-primary)]">
                                        {level}
                                    </span>
                                </div>
                                <span
                                    className={`text-xs font-medium ${isCompleted
                                        ? "text-[var(--text-primary)]"
                                        : "text-[var(--text-secondary)]"
                                        }`}
                                >
                                    {isCompleted ? "可重玩" : "未完成"}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </section>

            <section className="mt-8 rounded-[16px] border border-[rgba(93,64,55,0.2)] bg-[rgba(239,235,233,0.65)] p-4 text-sm text-[var(--text-secondary)]">
                第一關開始後會解釋遊玩方式，開始關卡後可使用上方播放按鈕播放序列，點擊問號可重新查看說明。
            </section>
        </div>
    );
}
