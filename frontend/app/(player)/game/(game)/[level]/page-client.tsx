"use client";

import { submitLevel as submitLevelAction } from "@/actions/games";
import Modal from "@/components/ui/Modal";
import { initAudio, playNote } from "@/lib/audio";
import { decodeSheet } from "@/lib/sheet-codec";
import { useGameStore } from "@/stores/gameStore";
import type { SubmitResponse } from "@/types/api";
import type { ClientUser } from "@/types/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useInsertionEffect, useMemo, useRef, useState } from "react";
import styles from "./game-grid.module.css";

/** Random hex string for class names. */
function randomHex() {
	return Array.from(crypto.getRandomValues(new Uint8Array(6)))
		.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Returns a fresh random CSS class name every time activeButton is non-null.
 * The corresponding style rule is injected synchronously via useInsertionEffect
 * so it's available before the browser paints.
 */
function useRotatingLitClass(activeButton: number | null) {
	const styleElRef = useRef<HTMLStyleElement | null>(null);

	// Compute a new class name synchronously during render
	const litClass = useMemo(() => {
		if (activeButton === null) return "";
		return `_${randomHex()}`;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeButton]);

	// Inject the style rule synchronously before paint
	useInsertionEffect(() => {
		if (!styleElRef.current) {
			const el = document.createElement("style");
			document.head.appendChild(el);
			styleElRef.current = el;
		}
		if (litClass) {
			styleElRef.current.textContent = `.${litClass}{filter:brightness(1.6);transform:scale(1.06)}`;
		} else {
			styleElRef.current.textContent = "";
		}
	}, [litClass]);

	// Cleanup on unmount
	useEffect(() => {
		return () => { styleElRef.current?.remove(); };
	}, []);

	return litClass;
}

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
	const litClass = useRotatingLitClass(activeButton);

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
						className={`${styles.cell} ${isActive ? litClass : ""}`}
						style={{
							backgroundColor: color,
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

interface LevelMeta {
	level: number;
	notes: number;
	speed: number;
}

export default function ChallengesPageClient({
	user,
	levelMeta,
	encodedSheet,
	sheetSeed,
	currentLevel
}: {
	user: ClientUser | null;
	levelMeta: LevelMeta | null;
	encodedSheet: string | null;
	sheetSeed: number;
	currentLevel: number;
}) {
	const router = useRouter();

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
	const [wasReplayOnSuccess, setWasReplayOnSuccess] = useState(false);

	const lastPlayRef = useRef(0);
	const lastHintRef = useRef(0);
	const playbackAbortRef = useRef<(() => void) | null>(null);

	// Decode sheet just-in-time (not stored as plain text in React state)
	const sheet = useMemo(() => {
		if (!encodedSheet) return [];
		try {
			return decodeSheet(encodedSheet, sheetSeed);
		} catch {
			return [];
		}
	}, [encodedSheet, sheetSeed]);

	const speed = levelMeta?.speed ?? 120;

	// Each unique note = one button, shuffled randomly per level visit
	const sheetKeyRef = useRef<string>("");
	const mappingRef = useRef<{ noteToButton: Map<string, number>; buttonToNote: Map<number, string> }>({
		noteToButton: new Map(),
		buttonToNote: new Map()
	});

	const uniqueNotes = useMemo(() => [...new Set(sheet)], [sheet]);
	const minButtons = Math.max(uniqueNotes.length, 2);
	const { cols, rows } = deriveGrid(minButtons);
	const buttonCount = cols * rows;

	// Rebuild mapping only when sheet content changes
	const sheetKey = uniqueNotes.join(",");
	if (sheetKey !== sheetKeyRef.current && uniqueNotes.length > 0) {
		sheetKeyRef.current = sheetKey;
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
		setWasReplayOnSuccess(false);
	}, [currentLevel, reset]);

	// Abort playback on unmount
	useEffect(() => {
		return () => {
			playbackAbortRef.current?.();
		};
	}, []);

	// Playback sequence
	const playSequence = useCallback(() => {
		if (!levelMeta || sheet.length === 0) return;

		initAudio();
		playbackAbortRef.current?.();

		setPhase("playing");
		setInputIndex(0);
		setActiveButton(null);

		const interval = 60000 / speed;
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

			setTimeout(() => {
				if (!cancelled) setActiveButton(null);
			}, activeDuration);

			stepIndex++;
			setTimeout(() => {
				if (!cancelled) playStep();
			}, interval);
		}

		setTimeout(() => {
			if (!cancelled) playStep();
		}, 500);
	}, [levelMeta, sheet, sheetButtons, speed, setPhase]);

	// Respond to play requests from layout
	useEffect(() => {
		if (playRequested > lastPlayRef.current) {
			lastPlayRef.current = playRequested;
			if (phase === "idle" || phase === "fail") {
				playSequence();
			}
		}
	}, [playRequested, phase, playSequence]);

	// Respond to hint requests from layout
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

		setActiveButton(index);
		setTimeout(() => setActiveButton(null), 150);
		const note = buttonToNote.get(index);
		if (note) playNote(note, 150);

		if (index === sheetButtons[inputIndex]) {
			const nextIndex = inputIndex + 1;
			if (nextIndex >= sheetButtons.length) {
				setPhase("success");
				setWasReplayOnSuccess(isReplay);
				if (!isReplay) {
					submitLevelAction().then(res => {
						if (res.data) setSubmitResult(res.data);
						else if (res.error) setSubmitError(res.error);
					});
				}
			} else {
				setInputIndex(nextIndex);
			}
		} else {
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
		if (isLocked) {
			router.replace("/game");
		}
	}, [isLocked, router]);

	if (isLocked) {
		return null;
	}

	return (
		<div className="flex flex-col h-full px-4 py-4">
			{/* Stage label */}
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<h2 className="text-[var(--text-primary)] font-serif text-lg font-bold">第 {currentLevel} 關</h2>
					{levelMeta && <span className="text-xs text-[var(--text-secondary)]">BPM {levelMeta.speed}</span>}
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
			<Modal open={phase === "success"} className="w-full max-w-sm overflow-hidden p-0">
				<div className="space-y-3 p-6">
					<h2 className="font-serif text-2xl font-bold text-[var(--text-primary)]">🎉 通關成功！</h2>
					{wasReplayOnSuccess && <p className="text-sm text-[var(--text-secondary)]">這關你已經過關囉，再玩一次也很棒！</p>}
					{!wasReplayOnSuccess && isMaxLevel && <p className="text-sm text-[var(--text-secondary)]">目前關卡已全數解鎖，去攤位互動或交朋友來開啟更多關卡吧！</p>}
					{!wasReplayOnSuccess && submitResult && submitResult.coupons.length > 0 && (
						<p className="text-sm font-semibold text-[var(--accent-gold)]">🎁 獲得 {submitResult.coupons.length} 張折價券！</p>
					)}
					{!wasReplayOnSuccess && submitError && <p className="text-sm text-red-500">{submitError}</p>}
					{!wasReplayOnSuccess && !submitResult && !submitError && !isReplay && <p className="animate-pulse text-sm text-[var(--text-secondary)]">提交中...</p>}
				</div>
				<div className="space-y-3 px-6 pb-6">
					{!isMaxLevel && (
						<button type="button" onClick={handleNextLevel} className="w-full cursor-pointer rounded-full bg-[var(--accent-gold)] py-3 text-base font-bold tracking-widest text-white shadow-md transition-transform active:scale-95">
							下一關
						</button>
					)}
					<button type="button" onClick={() => router.push("/game")} className="w-full cursor-pointer rounded-full bg-[var(--bg-header)] py-3 text-base font-bold tracking-widest text-[var(--text-light)] shadow-md transition-transform active:scale-95">
						返回列表
					</button>
				</div>
			</Modal>

			{/* Fail modal */}
			<Modal open={phase === "fail"} className="w-full max-w-sm overflow-hidden p-0">
				<div className="space-y-3 p-6">
					<h2 className="font-serif text-2xl font-bold text-[var(--text-primary)]">😵 挑戰失敗</h2>
					<p className="text-sm text-[var(--text-secondary)]">順序不正確，再試一次吧！</p>
				</div>
				<div className="space-y-3 px-6 pb-6">
					<button type="button" onClick={handleRetry} className="w-full cursor-pointer rounded-full bg-[var(--accent-gold)] py-3 text-base font-bold tracking-widest text-white shadow-md transition-transform active:scale-95">
						重新挑戰
					</button>
					<button type="button" onClick={() => router.push("/game")} className="w-full cursor-pointer rounded-full bg-[var(--bg-header)] py-3 text-base font-bold tracking-widest text-[var(--text-light)] shadow-md transition-transform active:scale-95">
						返回列表
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
				className="w-full max-w-sm overflow-hidden p-0"
			>
				<div className="space-y-3 p-6">
					<h2 className="font-serif text-2xl font-bold text-[var(--text-primary)]">🔇 關閉靜音模式</h2>
					<p className="text-sm text-[var(--text-secondary)]">遊戲需要播放音效，請確認你的 iPhone / iPad 已關閉靜音模式，才能聽到樂譜的聲音。</p>
					<div className="flex gap-3 justify-center">
						<a href="https://www.youtube.com/watch?v=OHw_kf4o8xM" target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--btn-red)] underline">🎦 無實體按鍵教學</a>
						<a href="https://www.youtube.com/watch?v=mlNh4dM9ddE" target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--btn-red)] underline">🎦 有實體按鍵教學</a>
					</div>
					<p className="text-xs text-[var(--text-secondary)] inline-flex items-center justify-center gap-1 w-full">
						按一下上方 <Image src="/assets/challenge/help.svg" alt="Help" width={24} height={24} className="brightness-50" /> 按鈕可隨時查看遊戲規則與提示。
					</p>
				</div>
				<div className="space-y-3 px-6 pb-6">
					<button
						type="button"
						onClick={() => {
							localStorage.setItem("ios-mute-hint-dismissed", "1");
							setShowIosMuteHint(false);
						}}
						className="w-full cursor-pointer rounded-full bg-[var(--accent-gold)] py-3 text-base font-bold tracking-widest text-white shadow-md transition-transform active:scale-95"
					>
						知道了
					</button>
				</div>
			</Modal>
		</div>
	);
}
