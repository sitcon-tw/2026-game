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
        <header className="sticky top-0 z-40 h-[var(--header-height)] bg-[var(--bg-header)]">
            <div className="relative flex h-full flex-col justify-center px-6">
                {showBack ? (
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="absolute left-4 top-3 grid h-8 w-8 place-items-center rounded-full bg-[rgba(239,235,233,0.18)] text-[var(--text-light)] shadow-sm"
                        aria-label="返回"
                    >
                        ←
                    </button>
                ) : null}
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
                        {showPlay || showHelp ? (
                            <div className="flex items-center gap-2">
                                {showPlay ? (
                                    <button
                                        type="button"
                                        className="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent-gold)] text-[var(--bg-header)] shadow-sm"
                                        aria-label="播放"
                                    >
                                        ▶
                                    </button>
                                ) : null}
                                {showHelp ? (
                                    <Link
                                        href="#"
                                        className="grid h-8 w-8 place-items-center rounded-full border border-[rgba(239,235,233,0.5)] text-[var(--text-light)]"
                                        aria-label="說明"
                                    >
                                        ?
                                    </Link>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
            <div className="h-3 w-full bg-[rgba(239,235,233,0.75)]" />
        </header>
    );
}
