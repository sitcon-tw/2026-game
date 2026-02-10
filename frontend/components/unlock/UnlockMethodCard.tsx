'use client';

interface UnlockMethodCardProps {
    title: string;
    current: number;
    total: number;
    onClick: () => void;
}

export default function UnlockMethodCard({
    title,
    current,
    total,
    onClick,
}: UnlockMethodCardProps) {
    const progress = (current / total) * 100;

    return (
        <button
            onClick={onClick}
            className="relative w-full bg-[#8D6E63] rounded-xl p-6 hover:bg-[#9A6C3B] transition-colors active:scale-[0.98] transition-transform"
        >
            {/* Title */}
            <div className="text-[#EFEBE9] text-2xl font-serif font-bold mb-4 text-center">
                {title}
            </div>

            {/* Progress Bar */}
            <div className="relative w-full h-3 bg-[#5D4037] rounded-full overflow-hidden mb-3">
                <div
                    className="absolute left-0 top-0 h-full bg-[#D4AF37] transition-all duration-300"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                />
            </div>

            {/* Progress Text */}
            <div className="text-[#EFEBE9] text-xl font-sans text-center">
                {current}/{total}
            </div>

            {/* Arrow Button */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-[#5D4037] rounded-full flex items-center justify-center">
                <svg
                    className="w-6 h-6 text-[#D4AF37]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M9 5l7 7-7 7"
                    />
                </svg>
            </div>
        </button>
    );
}
