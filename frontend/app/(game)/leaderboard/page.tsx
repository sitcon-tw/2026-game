"use client";

import { useState } from "react";

/* ──────────── Mock Data ──────────── */

interface LeaderboardEntry {
    rank: number;
    name: string;
    completedLevels: number;
    isCurrentUser?: boolean;
}

const CURRENT_USER_RANK = 18;

const TOP_ENTRIES: LeaderboardEntry[] = Array.from({ length: 10 }, (_, i) => ({
    rank: i + 1,
    name: "鴨子草",
    completedLevels: 40 - i * 2,
    isCurrentUser: i + 1 === CURRENT_USER_RANK,
}));

const NEARBY_ENTRIES: LeaderboardEntry[] = Array.from(
    { length: 11 },
    (_, i) => {
        const rank = CURRENT_USER_RANK - 5 + i;
        return {
            rank,
            name: rank === CURRENT_USER_RANK ? "鴨子草" : "鴨子草",
            completedLevels: 25 - i,
            isCurrentUser: rank === CURRENT_USER_RANK,
        };
    }
);

/* ──────────── Components ──────────── */

function RefreshIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        </svg>
    );
}

function TriangleDownIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
        >
            <path d="M12 17l-7-8h14l-7 8z" />
        </svg>
    );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
    return (
        <div
            className={`relative flex items-center justify-between rounded-xl px-5 py-3.5 transition-colors ${entry.isCurrentUser
                ? "bg-[var(--bg-header)] ring-2 ring-[var(--accent-gold)]"
                : "bg-[var(--bg-header)]/85"
                }`}
        >
            {/* Left: rank + name */}
            <div className="flex items-center gap-1.5 text-[var(--text-light)] font-semibold text-lg">
                <span className="tabular-nums">{entry.rank}.</span>
                <span>{entry.name}</span>
            </div>

            {/* Right: avatar + badge */}
            <div className="relative">
                <div className="h-10 w-10 rounded-full bg-[var(--bg-secondary)]" />
                {entry.isCurrentUser && (
                    <span className="absolute -right-2 -bottom-1 grid h-7 w-7 place-items-center rounded-full border-2 border-[var(--accent-gold)] bg-[var(--accent-gold)] text-xs font-bold text-[var(--bg-header)] shadow">
                        Y
                    </span>
                )}
            </div>
        </div>
    );
}

function YouDivider() {
    return (
        <div className="flex items-center justify-center gap-1.5 py-1 text-[var(--text-primary)] font-semibold text-base select-none">
            <span>You</span>
            <TriangleDownIcon className="mt-0.5" />
        </div>
    );
}

/* ──────────── Page ──────────── */

type ViewMode = "top" | "nearby";

export default function LeaderboardPage() {
    const [mode, setMode] = useState<ViewMode>("top");

    const entries = mode === "top" ? TOP_ENTRIES : NEARBY_ENTRIES;

    /* Split nearby into above/below the current user for the "You ▼" divider */
    const currentIdx = entries.findIndex((e) => e.isCurrentUser);
    const showDivider = mode === "nearby" && currentIdx > 0;
    const aboveEntries = showDivider ? entries.slice(0, currentIdx) : [];
    const belowEntries = showDivider ? entries.slice(currentIdx) : entries;

    return (
        <div className="px-5 pb-10 pt-6">
            {/* ── Header row ── */}
            <div className="mb-6 flex items-start justify-between">
                <h1 className="font-serif text-3xl font-bold text-[var(--text-primary)]">
                    排行榜
                </h1>

                <div className="flex items-center gap-2">
                    {/* Refresh */}
                    <button
                        type="button"
                        className="grid h-9 w-9 place-items-center rounded-full text-[var(--text-secondary)] active:scale-90 transition-transform"
                        aria-label="重新整理"
                    >
                        <RefreshIcon />
                    </button>

                    {/* Toggle: 前 N / 周圍 */}
                    <button
                        type="button"
                        onClick={() => setMode((m) => (m === "top" ? "nearby" : "top"))}
                        className="rounded-full border border-[var(--text-secondary)]/30 bg-[var(--bg-secondary)]/60 px-3 py-1 text-sm font-medium text-[var(--text-secondary)] backdrop-blur transition-colors active:bg-[var(--bg-secondary)]"
                    >
                        {mode === "top" ? (
                            <>
                                <span className="font-bold text-[var(--text-primary)]">
                                    前 {TOP_ENTRIES.length}
                                </span>{" "}
                                / 周圍
                            </>
                        ) : (
                            <>
                                前 {TOP_ENTRIES.length} /{" "}
                                <span className="font-bold text-[var(--text-primary)]">
                                    周圍
                                </span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Leaderboard list ── */}
            <div className="flex flex-col gap-3">
                {showDivider ? (
                    <>
                        {aboveEntries.map((entry) => (
                            <LeaderboardRow key={entry.rank} entry={entry} />
                        ))}
                        <YouDivider />
                        {belowEntries.map((entry) => (
                            <LeaderboardRow key={entry.rank} entry={entry} />
                        ))}
                    </>
                ) : (
                    <>
                        {/* In "top" mode, show all entries then a You divider if user not in top */}
                        {entries.map((entry) => (
                            <LeaderboardRow key={entry.rank} entry={entry} />
                        ))}
                        {mode === "top" &&
                            !entries.some((e) => e.isCurrentUser) && (
                                <>
                                    <YouDivider />
                                    {/* Show user's entry below */}
                                    <LeaderboardRow
                                        entry={{
                                            rank: CURRENT_USER_RANK,
                                            name: "鴨子草",
                                            completedLevels: 20,
                                            isCurrentUser: true,
                                        }}
                                    />
                                </>
                            )}
                    </>
                )}
            </div>
        </div>
    );
}
