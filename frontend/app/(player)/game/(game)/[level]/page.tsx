'use client';

import Image from 'next/image';
import { useState } from 'react';

const BUTTON_COLORS = [
    'var(--btn-red)',
    'var(--btn-yellow)',
    'var(--btn-green)',
    'var(--btn-blue)',
    'var(--btn-orange)',
    'var(--btn-purple)',
    'var(--btn-pink)',
    'var(--btn-cyan)',
];

/**
 * Stage configuration for the rhythm game.
 *
 * - `cols`    — number of grid columns
 * - `rows`    — number of grid rows
 * - `buttons` — total button count (cols × rows)
 */
const STAGE_CONFIG = [
    { cols: 1, rows: 2, buttons: 2 },   // level 1
    { cols: 2, rows: 2, buttons: 4 },   // level 2–5
    { cols: 2, rows: 4, buttons: 8 },   // level 6–10
    { cols: 3, rows: 4, buttons: 12 },  // level 11–15
    { cols: 4, rows: 4, buttons: 16 },  // level 16–20
    { cols: 4, rows: 5, buttons: 20 },  // level 21–25
    { cols: 4, rows: 6, buttons: 24 },  // level 26–30
    { cols: 4, rows: 7, buttons: 28 },  // level 31–35
    { cols: 4, rows: 8, buttons: 32 },  // level 36–40
];

/** Map a level number (1–40) to its STAGE_CONFIG index. */
function getStageIndex(level: number): number {
    if (level <= 1) return 0;   // level 1       → 2 buttons
    if (level <= 5) return 1;   // level 2–5     → 4 buttons
    // level 6–10 → idx 2, 11–15 → idx 3, …, 36–40 → idx 8
    return Math.min(Math.floor((level - 6) / 5) + 2, STAGE_CONFIG.length - 1);
}

function BlockGrid({
    cols,
    rows,
    buttons,
    level,
}: {
    cols: number;
    rows: number;
    buttons: number;
    level: number;
}) {
    return (
        <div
            className="grid gap-2 w-full h-full"
            style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
            }}
        >
            {Array.from({ length: buttons }).map((_, i) => {
                // Levels 2–5 (4 buttons): each button gets its own color
                // Other levels: same color per row
                const colorIndex =
                    level >= 2 && level <= 5
                        ? i % BUTTON_COLORS.length
                        : Math.floor(i / cols) % BUTTON_COLORS.length;
                const color = BUTTON_COLORS[colorIndex];
                return (
                    <div
                        key={i}
                        className="rounded-[var(--border-radius)] flex items-center justify-center"
                        style={{ backgroundColor: color }}
                    >
                        {/* Music note icon */}
                        <Image
                            src="/assets/challenge/quaver.svg"
                            alt="音符"
                            width={36}
                            height={36}
                        />
                    </div>
                );
            })}
        </div>
    );
}

export default function ChallengesPage() {
    // TODO: fetch from API — for now default to level 1
    const [currentLevel, setCurrentLevel] = useState(1);

    const stageIdx = getStageIndex(currentLevel);
    const stage = STAGE_CONFIG[stageIdx];

    return (
        <div className="flex flex-col h-full px-4 py-4">
            {/* Stage label */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h2 className="text-[var(--text-primary)] font-serif text-lg font-bold">
                        第 {currentLevel} 關
                    </h2>
                    <button
                        type="button"
                        onClick={() => setCurrentLevel((l) => Math.min(l + 1, 40))}
                        className="grid h-7 w-7 place-items-center rounded-full bg-[var(--accent-gold)] text-[var(--bg-header)] text-sm font-bold leading-none shadow-sm active:scale-90 transition-transform"
                        aria-label="下一關"
                    >
                        +
                    </button>
                </div>
                <span className="text-[var(--text-secondary)] text-sm font-sans">
                    {stage.buttons} 個按鈕 · {stage.cols}×{stage.rows}
                </span>
            </div>

            {/* Full-height game grid */}
            <div className="flex-1 min-h-0">
                <BlockGrid
                    cols={stage.cols}
                    rows={stage.rows}
                    buttons={stage.buttons}
                    level={currentLevel}
                />
            </div>
        </div>
    );
}
