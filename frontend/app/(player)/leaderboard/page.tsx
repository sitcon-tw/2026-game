"use client";

import { useMemo, useState } from "react";
import { useLeaderboard } from "@/hooks/api";
import type { RankEntry } from "@/types/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import UserNamecardModal from "@/components/namecard/UserNamecardModal";

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

function LeaderboardRow({
  entries,
  me,
  onSelectEntry,
}: {
  entries: RankEntry[];
  me: RankEntry | null;
  onSelectEntry: (entry: RankEntry) => void;
}) {
  const hasCurrentUser = entries.some((entry) => isSameEntry(me, entry));

  return (
    <div
      className={`relative rounded-xl px-5 py-3.5 transition-colors ${
        hasCurrentUser
          ? "bg-[var(--bg-header)] ring-2 ring-[var(--accent-gold)]"
          : "bg-[var(--bg-header)]/85"
      }`}
    >
      <div className="flex flex-col divide-y divide-[var(--text-light)]/20">
        {entries.map((entry, idx) => {
          const isCurrentUser = isSameEntry(me, entry);

          return (
            <button
              key={`${entry.rank}-${entry.nickname}-${entry.level}-${idx}`}
              type="button"
              onClick={() => {
                if (isCurrentUser) return;
                onSelectEntry(entry);
              }}
              className="relative flex w-full items-center justify-between py-2 text-left first:pt-0 last:pb-0"
            >
              {/* Left: rank + name */}
              <div className="flex items-center gap-1.5 text-[var(--text-light)] font-semibold text-lg">
                <span className="tabular-nums">{entry.rank}.</span>
                <span>{entry.nickname}</span>
              </div>

              {/* Right: avatar + badge */}
              <div className="relative">
                {entry.avatar ? (
                  <img
                    src={entry.avatar}
                    alt={entry.nickname}
                    className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-[var(--accent-bronze)] flex-shrink-0 flex items-center justify-center font-serif text-base font-bold text-white">
                    {entry.nickname.charAt(0)}
                  </div>
                )}
                {isCurrentUser && (
                  <span className="absolute -right-2 -bottom-1 grid h-7 w-7 place-items-center rounded-full border-2 border-[var(--accent-gold)] bg-[var(--accent-gold)] text-xs font-bold text-[var(--bg-header)] shadow">
                    Y
                  </span>
                )}
              </div>
            </button>
          );
        })}
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
type RankGroup = {
  rank: number;
  entries: RankEntry[];
};

function isSameEntry(a: RankEntry | null | undefined, b: RankEntry) {
  if (!a) return false;
  return a.rank === b.rank && a.nickname === b.nickname && a.level === b.level;
}

function groupEntriesByRank(entries: RankEntry[]): RankGroup[] {
  const groups = new Map<number, RankEntry[]>();
  const orderedRanks: number[] = [];

  entries.forEach((entry) => {
    if (!groups.has(entry.rank)) {
      groups.set(entry.rank, []);
      orderedRanks.push(entry.rank);
    }
    groups.get(entry.rank)?.push(entry);
  });

  return orderedRanks.map((rank) => ({
    rank,
    entries: groups.get(rank) ?? [],
  }));
}

export default function LeaderboardPage() {
  const [mode, setMode] = useState<ViewMode>("top");
  const [selectedEntry, setSelectedEntry] = useState<RankEntry | null>(null);
  const { data: leaderboard, isLoading, refetch } = useLeaderboard();

  const topEntries = useMemo(() => {
    return leaderboard?.rank ?? [];
  }, [leaderboard?.rank]);

  const nearbyEntries = useMemo(() => {
    return leaderboard?.around ?? [];
  }, [leaderboard?.around]);

  const me = leaderboard?.me ?? null;

  const entries = mode === "top" ? topEntries : nearbyEntries;
  const groupedEntries = useMemo(() => groupEntriesByRank(entries), [entries]);
  const topRankCount = useMemo(
    () => new Set(topEntries.map((entry) => entry.rank)).size,
    [topEntries],
  );

  /* Split nearby into above/below the current user for the "You ▼" divider */
  const currentGroupIdx = me
    ? groupedEntries.findIndex((group) =>
        group.entries.some((entry) => isSameEntry(me, entry)),
      )
    : -1;
  const showDivider = mode === "nearby" && currentGroupIdx > 0;
  const aboveGroups = showDivider
    ? groupedEntries.slice(0, currentGroupIdx)
    : [];
  const belowGroups = showDivider
    ? groupedEntries.slice(currentGroupIdx)
    : groupedEntries;

  if (isLoading) {
    return <LoadingSpinner />;
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
                  前 {topRankCount || 10}
                </span>{" "}
                / 周圍
              </>
            ) : (
              <>
                前 {topRankCount || 10} /{" "}
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
            {aboveGroups.map((group, idx) => (
              <LeaderboardRow
                key={`rank-group-${group.rank}-${idx}`}
                entries={group.entries}
                me={me}
                onSelectEntry={setSelectedEntry}
              />
            ))}
            <YouDivider />
            {belowGroups.map((group, idx) => (
              <LeaderboardRow
                key={`rank-group-${group.rank}-${idx}`}
                entries={group.entries}
                me={me}
                onSelectEntry={setSelectedEntry}
              />
            ))}
          </>
        ) : (
          <>
            {groupedEntries.map((group, idx) => (
              <LeaderboardRow
                key={`rank-group-${group.rank}-${idx}`}
                entries={group.entries}
                me={me}
                onSelectEntry={setSelectedEntry}
              />
            ))}
            {mode === "top" &&
              me &&
              !groupedEntries.some((group) =>
                group.entries.some((entry) => isSameEntry(me, entry)),
              ) && (
                <>
                  <YouDivider />
                  <LeaderboardRow
                    entries={[me]}
                    me={me}
                    onSelectEntry={setSelectedEntry}
                  />
                </>
              )}
          </>
        )}
      </div>

      <UserNamecardModal
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        user={
          selectedEntry
            ? {
                nickname: selectedEntry.nickname,
                avatar: selectedEntry.avatar,
                current_level: selectedEntry.level,
                namecard: selectedEntry.namecard,
              }
            : null
        }
      />
    </div>
  );
}
