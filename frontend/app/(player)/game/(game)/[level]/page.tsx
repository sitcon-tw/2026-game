"use client";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Modal from "@/components/ui/Modal";
import { useCurrentUser, useLevelInfo, useSubmitLevel } from "@/hooks/api";
import { initAudio, playNote } from "@/lib/audio";
import { useGameStore } from "@/stores/gameStore";
import type { SubmitResponse } from "@/types/api";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const BUTTON_COLORS = ["var(--btn-red)", "var(--btn-yellow)", "var(--btn-green)", "var(--btn-blue)", "var(--btn-orange)", "var(--btn-purple)", "var(--btn-pink)", "var(--btn-cyan)"];

/** Shuffle an array using Fisher-Yates with Math.random(). */
function shuffleArray<T>(arr: T[]): T[] {
	const result = [...arr];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

/** Derive grid dimensions from button count. */
function deriveGrid(buttonCount: number): { cols: number; rows: number } {
	if (buttonCount <= 2) return { cols: 2, rows: 1 };
	if (buttonCount <= 3) return { cols: 3, rows: 1 };
	if (buttonCount <= 4) return { cols: 2, rows: 2 };
	if (buttonCount <= 6) return { cols: 3, rows: 2 };
	if (buttonCount <= 8) return { cols: 4, rows: 2 };
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
	onButtonClick
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
				gridTemplateRows: `repeat(${rows}, 1fr)`
			}}
		>
			{Array.from({ length: buttonCount }).map((_, i) => {
				const colorIndex = i % BUTTON_COLORS.length;
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
							filter: isActive ? "brightness(1.6)" : "brightness(1)",
							transform: isActive ? "scale(1.06)" : "scale(1)",
							boxShadow: isActive ? `0 0 20px 4px ${color}` : "none"
						}}
					>
						<Image src="/assets/challenge/quaver.svg" alt="音符" width={36} height={36} className="pointer-events-none" />
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

	const maxPlayableLevel = user ? Math.min(user.unlock_level, user.current_level + 1) : 0;
	const isReplay = user ? currentLevel <= user.current_level : false;
	const isMaxLevel = user ? currentLevel >= user.unlock_level : false;
	const isLocked = user ? currentLevel > maxPlayableLevel : false;

	const { phase, setPhase, playRequested, hintRequested, reset } = useGameStore();
	const [activeButton, setActiveButton] = useState<number | null>(null);
	const [inputIndex, setInputIndex] = useState(0);
	const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [showIosMuteHint, setShowIosMuteHint] = useState(false);

	// Track play/hint request counts to respond to layout button presses
	const lastPlayRef = useRef(0);
	const lastHintRef = useRef(0);
	const playbackAbortRef = useRef<(() => void) | null>(null);

	// Derive button count and grid from API data
	const sheet = levelInfo?.sheet ?? [];
	const speed = levelInfo?.speed ?? 120;

	// Each unique note = one button, shuffled randomly per level visit
	const sheetKeyRef = useRef<string>("");
	const mappingRef = useRef<{ noteToButton: Map<string, number>; buttonToNote: Map<number, string> }>({
		noteToButton: new Map(),
		buttonToNote: new Map()
	});

	const uniqueNotes = useMemo(() => [...new Set(sheet)], [sheet]);
	const minButtons = Math.max(uniqueNotes.length, 2);
	const { cols, rows } = deriveGrid(minButtons);
	const buttonCount = cols * rows; // fill full grid, no missing corners

	// Rebuild mapping only when sheet content changes
	const sheetKey = uniqueNotes.join(",");
	if (sheetKey !== sheetKeyRef.current && uniqueNotes.length > 0) {
		sheetKeyRef.current = sheetKey;
		// Randomly assign notes to buttonCount slots (extra slots are decoys)
		const slots = Array.from({ length: buttonCount }, (_, i) => i);
		const shuffledSlots = shuffleArray(slots);
		const noteToButton = new Map<string, number>();
		const buttonToNote = new Map<number, string>();
		uniqueNotes.forEach((note, idx) => {
			noteToButton.set(note, shuffledSlots[idx]);
			buttonToNote.set(shuffledSlots[idx], note);
		});
		mappingRef.current = { noteToButton, buttonToNote };
	}

	const { noteToButton, buttonToNote } = mappingRef.current;

	// Map sheet notes to button indices
	const sheetButtons = sheet.map(note => noteToButton.get(note) ?? 0);

	// Show iOS silent mode hint (once, persisted in localStorage)
	useEffect(() => {
		if (localStorage.getItem("ios-mute-hint-dismissed")) return;
		const ua = navigator.userAgent;
		const isIos = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
		if (isIos) {
			setShowIosMuteHint(true);
		}
	}, []);

	// Reset game state when level changes
	useEffect(() => {
		reset();
		setActiveButton(null);
		setInputIndex(0);
		setSubmitResult(null);
		setSubmitError(null);
	}, [currentLevel, reset]);

	// Abort playback on unmount (e.g. navigating away mid-sequence)
	useEffect(() => {
		return () => {
			playbackAbortRef.current?.();
		};
	}, []);

	// Playback sequence using requestAnimationFrame for precision
	const playSequence = useCallback(() => {
		if (!levelInfo || sheet.length === 0) return;

		// Warm up AudioContext on user gesture for WebKit/Safari
		initAudio();

		// Abort any existing playback
		playbackAbortRef.current?.();

		setPhase("playing");
		setInputIndex(0);
		setActiveButton(null);

		const interval = 60000 / speed; // ms per beat
		const activeDuration = interval * 0.7;
		let cancelled = false;
		let stepIndex = 0;

		playbackAbortRef.current = () => {
			cancelled = true;
		};

		function playStep() {
			if (cancelled || stepIndex >= sheetButtons.length) {
				if (!cancelled) {
					setActiveButton(null);
					setPhase("input");
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
			if (phase === "idle" || phase === "fail") {
				playSequence();
			}
		}
	}, [playRequested, phase, playSequence]);

	// Respond to hint requests from layout (replay sequence)
	useEffect(() => {
		if (hintRequested > lastHintRef.current) {
			lastHintRef.current = hintRequested;
			if (phase === "idle" || phase === "input" || phase === "fail") {
				playSequence();
			}
		}
	}, [hintRequested, phase, playSequence]);

	// Handle player button click
	const handleButtonClick = (index: number) => {
		if (phase !== "input") return;

		// Flash the clicked button and play its sound
		setActiveButton(index);
		setTimeout(() => setActiveButton(null), 150);
		const note = buttonToNote.get(index);
		if (note) playNote(note, 150);

		if (index === sheetButtons[inputIndex]) {
			// Correct
			const nextIndex = inputIndex + 1;
			if (nextIndex >= sheetButtons.length) {
				// All correct — success!
				setPhase("success");
				// Submit whenever this is a first clear (including max unlocked level).
				if (!isReplay) {
					submitLevel.mutate(undefined, {
						onSuccess: data => setSubmitResult(data),
						onError: err => setSubmitError((err as Error).message)
					});
				}
			} else {
				setInputIndex(nextIndex);
			}
		} else {
			// Wrong — fail
			setPhase("fail");
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
			router.replace("/game");
		}
	}, [isUserLoading, isLocked, router]);

	if (isUserLoading || isLevelLoading) {
		return <LoadingSpinner />;
	}

	if (isLocked) {
		return null; // will redirect
	}

	return (
		<div className="flex flex-col h-full px-4 py-4">
			{/* Stage label */}
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<h2 className="text-[var(--text-primary)] font-serif text-lg font-bold">第 {currentLevel} 關</h2>
					{levelInfo && <span className="text-xs text-[var(--text-secondary)]">BPM {levelInfo.speed}</span>}
				</div>
				<span className="text-[var(--text-secondary)] text-sm font-sans">
					{buttonCount} 個按鈕 · {cols}×{rows}
				</span>
			</div>

			{/* Status bar */}
			<div className="mb-2 text-center text-sm font-medium">
				{phase === "idle" && <span className="text-[var(--text-secondary)]">按一下下方鍵盤開始遊戲</span>}
				{phase === "playing" && <span className="text-[var(--text-primary)]">🎵 播放中，請記住順序...</span>}
				{phase === "input" && (
					<span className="text-[var(--text-primary)]">
						輪到你了！依序點擊按鈕 ({inputIndex}/{sheetButtons.length})
					</span>
				)}
			</div>

			{/* Full-height game grid */}
			<div className="flex-1 min-h-0 relative">
				<BlockGrid cols={cols} rows={rows} buttonCount={buttonCount} activeButton={activeButton} inputEnabled={phase === "input"} onButtonClick={handleButtonClick} />

				{/* Idle play overlay */}
				{phase === "idle" && (
					<button type="button" onClick={playSequence} className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-[var(--border-radius)] cursor-pointer">
						<div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
							<svg viewBox="0 0 24 24" fill="white" className="w-10 h-10 ml-1">
								<path d="M8 5v14l11-7z" />
							</svg>
						</div>
					</button>
				)}
			</div>

			{/* Success modal */}
			<Modal open={phase === "success"} className="w-full max-w-sm p-6 text-center">
				<div className="text-4xl mb-3">🎉</div>
				<h3 className="text-[var(--text-primary)] font-serif text-xl font-bold mb-2">通關成功！</h3>
				{isReplay && <p className="text-[var(--text-secondary)] text-sm mb-4">（重玩關卡，不影響進度）</p>}
				{!isReplay && isMaxLevel && <p className="text-[var(--text-secondary)] text-sm mb-4">（已達最大解鎖關卡，透過攤位互動解鎖更多關卡）</p>}
				{!isReplay && submitResult && (
					<div className="space-y-2 mb-4">
						<p className="text-[var(--text-secondary)] text-sm">目前進度：第 {submitResult.current_level} 關</p>
						{submitResult.coupons.length > 0 && <p className="text-[var(--accent-gold)] text-sm font-semibold">🎁 獲得 {submitResult.coupons.length} 張折價券！</p>}
					</div>
				)}
				{!isReplay && submitError && <p className="text-red-500 text-sm mb-4">{submitError}</p>}
				{!isReplay && submitLevel.isPending && <p className="animate-pulse text-[var(--text-secondary)] text-sm mb-4">提交中...</p>}
				<div className="flex gap-3 justify-center">
					<button type="button" onClick={() => router.push("/game")} className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm font-medium cursor-pointer">
						返回列表
					</button>
					{!isMaxLevel && (
						<button type="button" onClick={handleNextLevel} className="px-4 py-2 rounded-lg bg-[var(--accent-gold)] text-white text-sm font-bold cursor-pointer">
							下一關
						</button>
					)}
				</div>
			</Modal>

			{/* Fail modal */}
			<Modal open={phase === "fail"} className="w-full max-w-sm p-6 text-center">
				<div className="text-4xl mb-3">😵</div>
				<h3 className="text-[var(--text-primary)] font-serif text-xl font-bold mb-2">挑戰失敗</h3>
				<p className="text-[var(--text-secondary)] text-sm mb-4">順序不正確，再試一次吧！</p>
				<div className="flex gap-3 justify-center">
					<button type="button" onClick={() => router.push("/game")} className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm font-medium cursor-pointer">
						返回列表
					</button>
					<button type="button" onClick={handleRetry} className="px-4 py-2 rounded-lg bg-[var(--accent-gold)] text-white text-sm font-bold cursor-pointer">
						重新挑戰
					</button>
				</div>
			</Modal>

			{/* iOS silent mode hint */}
			<Modal
				open={showIosMuteHint}
				onClose={() => {
					localStorage.setItem("ios-mute-hint-dismissed", "1");
					setShowIosMuteHint(false);
				}}
				className="w-full max-w-sm p-6 text-center"
			>
				<div className="text-4xl mb-3">🔇</div>
				<h3 className="text-[var(--text-primary)] font-serif text-xl font-bold mb-2">關閉靜音模式</h3>
				<p className="text-[var(--text-secondary)] text-sm mb-3">遊戲需要播放音效，請確認你的 iPhone / iPad 已關閉靜音模式，才能聽到樂譜的聲音。</p>
				<div className="flex gap-2 justify-center mb-3">
					<a href="https://www.youtube.com/watch?v=OHw_kf4o8xM" target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--btn-red)] underline">🎦 無實體按鍵教學</a>
					<a href="https://www.youtube.com/watch?v=mlNh4dM9ddE" target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--btn-red)] underline">🎦 有實體按鍵教學</a>
				</div>
				<p className="text-[var(--text-secondary)] text-xs mb-4 inline-flex items-center justify-center gap-1 w-full">
					按一下上方 <Image src="/assets/challenge/help.svg" alt="Help" width={24} height={24} className="brightness-50" /> 按鈕可隨時查看遊戲規則與提示。
				</p>
				<button
					type="button"
					onClick={() => {
						localStorage.setItem("ios-mute-hint-dismissed", "1");
						setShowIosMuteHint(false);
					}}
					className="px-5 py-2 rounded-lg bg-[var(--accent-gold)] text-white text-sm font-bold cursor-pointer"
				>
					知道了
				</button>
			</Modal>
		</div>
	);
}
