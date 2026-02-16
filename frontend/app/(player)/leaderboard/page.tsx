"use client";

import { useState } from "react";
import { useLeaderboard } from "@/hooks/api";
import type { RankEntry } from "@/types/api";

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

function LeaderboardRow({ entry, isCurrentUser }: { entry: RankEntry; isCurrentUser?: boolean }) {
    return (
        <div
            className={`relative flex items-center justify-between rounded-xl px-5 py-3.5 transition-colors ${isCurrentUser
                ? "bg-[var(--bg-header)] ring-2 ring-[var(--accent-gold)]"
                : "bg-[var(--bg-header)]/85"
                }`}
        >
            {/* Left: rank + name */}
            <div className="flex items-center gap-1.5 text-[var(--text-light)] font-semibold text-lg">
                <span className="tabular-nums">{entry.rank}.</span>
                <span>{entry.nickname}</span>
            </div>

            {/* Right: avatar + badge */}
            <div className="relative">
                <div className="h-10 w-10 rounded-full bg-[var(--bg-secondary)]" />
                {isCurrentUser && (
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
    const { data: leaderboard, isLoading, refetch } = useLeaderboard();

    const topEntries = leaderboard?.rank ?? [];
    const nearbyEntries = leaderboard?.around ?? [];
    const me = leaderboard?.me;

    const entries = mode === "top" ? topEntries : nearbyEntries;

    /* Split nearby into above/below the current user for the "You ▼" divider */
    const currentIdx = me ? entries.findIndex((e) => e.rank === me.rank) : -1;
    const showDivider = mode === "nearby" && currentIdx > 0;
    const aboveEntries = showDivider ? entries.slice(0, currentIdx) : [];
    const belowEntries = showDivider ? entries.slice(currentIdx) : entries;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="mb-4 inline-block animate-spin text-4xl text-[var(--text-gold)]">
                        ✦
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">載入中…</p>
                </div>
            </div>
        );
    }

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
                        onClick={() => refetch()}
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
                                    前 {topEntries.length || 10}
                                </span>{" "}
                                / 周圍
                            </>
                        ) : (
                            <>
                                前 {topEntries.length || 10} /{" "}
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
                            <LeaderboardRow key={entry.rank} entry={entry} isCurrentUser={me?.rank === entry.rank} />
                        ))}
                        <YouDivider />
                        {belowEntries.map((entry) => (
                            <LeaderboardRow key={entry.rank} entry={entry} isCurrentUser={me?.rank === entry.rank} />
                        ))}
                    </>
                ) : (
                    <>
                        {entries.map((entry) => (
                            <LeaderboardRow key={entry.rank} entry={entry} isCurrentUser={me?.rank === entry.rank} />
                        ))}
                        {mode === "top" && me &&
                            !entries.some((e) => e.rank === me.rank) && (
                                <>
                                    <YouDivider />
                                    <LeaderboardRow entry={me} isCurrentUser />
                                </>
                            )}
                    </>
                )}
            </div>
        </div>
    );
}
