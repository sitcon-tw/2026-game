"use client";

export default function Header() {

    return (
        <header className="sticky top-0 z-40 h-[var(--header-height)] bg-[var(--bg-header)]">
            <div className="relative flex h-full flex-col justify-center px-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-[2] flex-col gap-1">
                        <div className="text-[var(--text-gold)] font-serif text-2xl font-semibold tracking-wide">
                            SITCON 大地遊戲
                        </div>
                        <div className="text-[var(--text-light)]/90 font-serif text-lg">
                            第 10 名
                        </div>
                    </div>
                    <div className="flex flex-[1] flex-col items-center gap-2">
                        <div className="text-[var(--text-light)]/90 font-serif text-lg">
                            4/5 關
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[rgba(239,235,233,0.35)]">
                            <div className="h-full w-[80%] rounded-full bg-[var(--accent-gold)]" />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
