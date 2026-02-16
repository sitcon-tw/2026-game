'use client';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useCurrentUser, useLevelInfo, useSubmitLevel } from '@/hooks/api';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { playNote } from '@/lib/audio';
import type { SubmitResponse } from '@/types/api';

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

/** Map a note string to a deterministic button index. */
function mapNoteToButtonIndex(noteString: string, buttonCount: number): number {
    let hash = 0;
    for (let i = 0; i < noteString.length; i++) {
        hash += noteString.charCodeAt(i);
    }
    return hash % buttonCount;
}

/** Derive grid dimensions from button count (API-driven). */
function deriveGrid(buttonCount: number): { cols: number; rows: number } {
    if (buttonCount <= 2) return { cols: 1, rows: 2 };
    if (buttonCount <= 4) return { cols: 2, rows: 2 };
    // For larger counts, use max 4 columns
    const cols = Math.min(4, buttonCount);
    const rows = Math.ceil(buttonCount / cols);
    return { cols, rows };
}

function BlockGrid({
    cols,
    rows,
    buttonCount,
    activeButton,
    inputEnabled,
    onButtonClick,
}: {
    cols: number;
    rows: number;
    buttonCount: number;
    activeButton: number | null;
    inputEnabled: boolean;
    onButtonClick: (index: number) => void;
}) {
    return (
        <div
            className="grid gap-2 w-full h-full"
            style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
            }}
        >
            {Array.from({ length: buttonCount }).map((_, i) => {
                const colorIndex =
                    buttonCount <= 4
                        ? i % BUTTON_COLORS.length
                        : Math.floor(i / cols) % BUTTON_COLORS.length;
                const color = BUTTON_COLORS[colorIndex];
                const isActive = activeButton === i;

                return (
                    <button
                        key={i}
                        type="button"
                        disabled={!inputEnabled}
                        onClick={() => onButtonClick(i)}
                        className="rounded-[var(--border-radius)] flex items-center justify-center transition-all duration-150 cursor-pointer"
                        style={{
                            backgroundColor: color,
                            filter: isActive ? 'brightness(1.6)' : 'brightness(1)',
                            transform: isActive ? 'scale(1.06)' : 'scale(1)',
                            boxShadow: isActive
                                ? `0 0 20px 4px ${color}`
                                : 'none',
                        }}
                    >
                        <Image
                            src="/assets/challenge/quaver.svg"
                            alt="音符"
                            width={36}
                            height={36}
                            className="pointer-events-none"
                        />
                    </button>
                );
            })}
        </div>
    );
}

export default function ChallengesPage() {
    const params = useParams();
    const router = useRouter();
    const currentLevel = Number(params.level) || 1;
    const { data: user, isLoading: isUserLoading } = useCurrentUser();
    const { data: levelInfo, isLoading: isLevelLoading } = useLevelInfo(currentLevel);
    const submitLevel = useSubmitLevel();

    const isReplay = user ? currentLevel < user.current_level : false;
    const isMaxLevel = user ? currentLevel >= user.unlock_level : false;
    const isLocked = user ? currentLevel > user.unlock_level : false;

    const { phase, setPhase, playRequested, hintRequested, reset } = useGameStore();
    const [activeButton, setActiveButton] = useState<number | null>(null);
    const [inputIndex, setInputIndex] = useState(0);
    const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Track play/hint request counts to respond to layout button presses
    const lastPlayRef = useRef(0);
    const lastHintRef = useRef(0);
    const playbackAbortRef = useRef<(() => void) | null>(null);

    // Derive button count and grid from API data
    const sheet = levelInfo?.sheet ?? [];
    const speed = levelInfo?.speed ?? 120;
    // Collect unique button indices to determine button count
    const buttonCount = levelInfo
        ? (() => {
            if (currentLevel <= 1) return 2;
            if (currentLevel <= 5) return 4;
            const base = Math.min(Math.floor((currentLevel - 6) / 5) + 2, 7);
            return Math.min((base + 1) * 4, 32);
        })()
        : 4;
    const { cols, rows } = deriveGrid(buttonCount);

    // Map sheet notes to button indices based on actual button count
    const sheetButtons = sheet.map((note) => mapNoteToButtonIndex(note, buttonCount));

    // Build a reverse map: button index → first note name mapped to it (for click sound)
    const buttonNoteMap = new Map<number, string>();
    for (const note of sheet) {
        const idx = mapNoteToButtonIndex(note, buttonCount);
        if (!buttonNoteMap.has(idx)) buttonNoteMap.set(idx, note);
    }

    // Reset game state when level changes
    useEffect(() => {
        reset();
        setActiveButton(null);
        setInputIndex(0);
        setSubmitResult(null);
        setSubmitError(null);
    }, [currentLevel, reset]);

    // Playback sequence using requestAnimationFrame for precision
    const playSequence = useCallback(() => {
        if (!levelInfo || sheet.length === 0) return;

        // Abort any existing playback
        playbackAbortRef.current?.();

        setPhase('playing');
        setInputIndex(0);
        setActiveButton(null);

        const interval = 60000 / speed; // ms per beat
        const activeDuration = interval * 0.7;
        let cancelled = false;
        let stepIndex = 0;

        playbackAbortRef.current = () => { cancelled = true; };

        function playStep() {
            if (cancelled || stepIndex >= sheetButtons.length) {
                if (!cancelled) {
                    setActiveButton(null);
                    setPhase('input');
                }
                return;
            }

            const btnIdx = sheetButtons[stepIndex];
            setActiveButton(btnIdx);
            playNote(sheet[stepIndex], activeDuration);

            // Turn off highlight after active duration
            setTimeout(() => {
                if (!cancelled) setActiveButton(null);
            }, activeDuration);

            stepIndex++;
            // Schedule next step
            setTimeout(() => {
                if (!cancelled) playStep();
            }, interval);
        }

        // Delay 500ms before starting the first note
        setTimeout(() => {
            if (!cancelled) playStep();
        }, 500);
    }, [levelInfo, sheet, sheetButtons, speed, setPhase]);

    // Respond to play requests from layout
    useEffect(() => {
        if (playRequested > lastPlayRef.current) {
            lastPlayRef.current = playRequested;
            if (phase === 'idle' || phase === 'fail') {
                playSequence();
            }
        }
    }, [playRequested, phase, playSequence]);

    // Respond to hint requests from layout (replay sequence)
    useEffect(() => {
        if (hintRequested > lastHintRef.current) {
            lastHintRef.current = hintRequested;
            if (phase === 'idle' || phase === 'input' || phase === 'fail') {
                playSequence();
            }
        }
    }, [hintRequested, phase, playSequence]);

    // Handle player button click
    const handleButtonClick = (index: number) => {
        if (phase !== 'input') return;

        // Flash the clicked button and play its sound
        setActiveButton(index);
        setTimeout(() => setActiveButton(null), 150);
        const note = buttonNoteMap.get(index);
        if (note) playNote(note, 150);

        if (index === sheetButtons[inputIndex]) {
            // Correct
            const nextIndex = inputIndex + 1;
            if (nextIndex >= sheetButtons.length) {
                // All correct — success!
                setPhase('success');
                // Only submit if this is the current (uncleared) level, not a replay, and not at max unlock level
                if (!isReplay && !isMaxLevel) {
                    submitLevel.mutate(undefined, {
                        onSuccess: (data) => setSubmitResult(data),
                        onError: (err) => setSubmitError((err as Error).message),
                    });
                }
            } else {
                setInputIndex(nextIndex);
            }
        } else {
            // Wrong — fail
            setPhase('fail');
        }
    };

    const handleRetry = () => {
        setSubmitResult(null);
        setSubmitError(null);
        setInputIndex(0);
        playSequence();
    };

    const handleNextLevel = () => {
        router.push(`/game/${currentLevel + 1}`);
    };

    // Redirect to level list if this level is locked
    useEffect(() => {
        if (!isUserLoading && isLocked) {
            router.replace('/game');
        }
    }, [isUserLoading, isLocked, router]);

    if (isUserLoading || isLevelLoading) {
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

    if (isLocked) {
        return null; // will redirect
    }

    return (
        <div className="flex flex-col h-full px-4 py-4">
            {/* Stage label */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h2 className="text-[var(--text-primary)] font-serif text-lg font-bold">
                        第 {currentLevel} 關
                    </h2>
                    {levelInfo && (
                        <span className="text-xs text-[var(--text-secondary)]">
                            BPM {levelInfo.speed}
                        </span>
                    )}
                </div>
                <span className="text-[var(--text-secondary)] text-sm font-sans">
                    {buttonCount} 個按鈕 · {cols}×{rows}
                </span>
            </div>

            {/* Status bar */}
            <div className="mb-2 text-center text-sm font-medium">
                {phase === 'idle' && (
                    <span className="text-[var(--text-secondary)]">
                        點擊按鈕區域開始遊戲
                    </span>
                )}
                {phase === 'playing' && (
                    <span className="text-[var(--accent-gold)]">
                        🎵 播放中，請記住順序...
                    </span>
                )}
                {phase === 'input' && (
                    <span className="text-[var(--text-primary)]">
                        輪到你了！依序點擊按鈕 ({inputIndex}/{sheetButtons.length})
                    </span>
                )}
            </div>

            {/* Full-height game grid */}
            <div className="flex-1 min-h-0 relative">
                <BlockGrid
                    cols={cols}
                    rows={rows}
                    buttonCount={buttonCount}
                    activeButton={activeButton}
                    inputEnabled={phase === 'input'}
                    onButtonClick={handleButtonClick}
                />

                {/* Idle play overlay */}
                {phase === 'idle' && (
                    <button
                        type="button"
                        onClick={playSequence}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-[var(--border-radius)] cursor-pointer"
                    >
                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <svg
                                viewBox="0 0 24 24"
                                fill="white"
                                className="w-10 h-10 ml-1"
                            >
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </button>
                )}

                {/* Success overlay */}
                {phase === 'success' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-[var(--border-radius)]">
                        <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 mx-4 text-center shadow-xl max-w-sm w-full">
                            <div className="text-4xl mb-3">🎉</div>
                            <h3 className="text-[var(--text-primary)] font-serif text-xl font-bold mb-2">
                                通關成功！
                            </h3>
                            {isReplay && (
                                <p className="text-[var(--text-secondary)] text-sm mb-4">
                                    （重玩關卡，不影響進度）
                                </p>
                            )}
                            {!isReplay && isMaxLevel && (
                                <p className="text-[var(--text-secondary)] text-sm mb-4">
                                    （已達最大解鎖關卡，透過攤位互動解鎖更多關卡）
                                </p>
                            )}
                            {!isReplay && !isMaxLevel && submitResult && (
                                <div className="space-y-2 mb-4">
                                    <p className="text-[var(--text-secondary)] text-sm">
                                        目前進度：第 {submitResult.current_level} 關
                                    </p>
                                    {submitResult.coupons.length > 0 && (
                                        <p className="text-[var(--accent-gold)] text-sm font-semibold">
                                            🎁 獲得 {submitResult.coupons.length} 張折價券！
                                        </p>
                                    )}
                                </div>
                            )}
                            {!isReplay && !isMaxLevel && submitError && (
                                <p className="text-red-500 text-sm mb-4">{submitError}</p>
                            )}
                            {!isReplay && !isMaxLevel && submitLevel.isPending && (
                                <p className="animate-pulse text-[var(--text-secondary)] text-sm mb-4">提交中...</p>
                            )}
                            <div className="flex gap-3 justify-center">
                                <button
                                    type="button"
                                    onClick={() => router.push('/game')}
                                    className="px-4 py-2 rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm font-medium cursor-pointer"
                                >
                                    返回列表
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextLevel}
                                    className="px-4 py-2 rounded-lg bg-[var(--accent-gold)] text-white text-sm font-bold cursor-pointer"
                                >
                                    下一關
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Fail overlay */}
                {phase === 'fail' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-[var(--border-radius)]">
                        <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 mx-4 text-center shadow-xl max-w-sm w-full">
                            <div className="text-4xl mb-3">😵</div>
                            <h3 className="text-[var(--text-primary)] font-serif text-xl font-bold mb-2">
                                挑戰失敗
                            </h3>
                            <p className="text-[var(--text-secondary)] text-sm mb-4">
                                順序不正確，再試一次吧！
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    type="button"
                                    onClick={() => router.push('/game')}
                                    className="px-4 py-2 rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm font-medium cursor-pointer"
                                >
                                    返回列表
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRetry}
                                    className="px-4 py-2 rounded-lg bg-[var(--accent-gold)] text-white text-sm font-bold cursor-pointer"
                                >
                                    重新挑戰
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
