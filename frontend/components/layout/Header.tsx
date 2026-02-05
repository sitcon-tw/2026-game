"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const HEADER_CONFIG: Record<
    string,
    { showBack: boolean; showPlay: boolean; showHelp: boolean }
> = {
    "/levels": { showBack: false, showPlay: false, showHelp: false },
    "/game/[id]": { showBack: true, showPlay: true, showHelp: true },
    "/unlock": { showBack: false, showPlay: false, showHelp: false },
    "/scanner": { showBack: false, showPlay: false, showHelp: false },
    "/leaderboard": { showBack: false, showPlay: false, showHelp: false },
    "/rewards": { showBack: true, showPlay: false, showHelp: false },
};

const resolveConfig = (pathname: string) => {
    if (pathname.startsWith("/game/")) {
        return HEADER_CONFIG["/game/[id]"];
    }
    return HEADER_CONFIG[pathname] ?? {
        showBack: true,
        showPlay: false,
        showHelp: false,
    };
};

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { showBack, showPlay, showHelp } = resolveConfig(pathname);

    return (
        <header className="sticky top-0 z-40 h-[var(--header-height)] bg-gradient-to-r from-[var(--bg-header)] to-[var(--bg-header-accent)]">
            <div className="flex h-full flex-col justify-between px-4 pb-2 pt-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {showBack ? (
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="grid h-8 w-8 place-items-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm"
                                aria-label="返回"
                            >
                                ←
                            </button>
                        ) : (
                            <div className="h-8 w-8" />
                        )}
                        <div className="text-[var(--text-gold)] font-serif text-lg font-semibold tracking-wide">
                            SITCON 大地遊戲
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--text-light)]">
                        <span className="rounded-full border border-[rgba(239,235,233,0.4)] px-2 py-0.5 text-xs">
                            第10名
                        </span>
                        <span className="rounded-full border border-[rgba(239,235,233,0.4)] px-2 py-0.5 text-xs">
                            第 4 關
                        </span>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.2)]">
                        <div className="h-full w-[42%] rounded-full bg-[var(--accent-gold)]" />
                    </div>
                    <div className="ml-3 flex items-center gap-2">
                        {showPlay ? (
                            <button
                                type="button"
                                className="grid h-9 w-9 place-items-center rounded-full bg-[var(--accent-gold)] text-[var(--bg-header)] shadow-sm"
                                aria-label="播放"
                            >
                                ▶
                            </button>
                        ) : null}
                        {showHelp ? (
                            <Link
                                href="#"
                                className="grid h-9 w-9 place-items-center rounded-full border border-[rgba(239,235,233,0.5)] text-[var(--text-light)]"
                                aria-label="說明"
                            >
                                ?
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>
            <div className="h-[2px] w-full bg-[var(--accent-gold)]" />
        </header>
    );
}
