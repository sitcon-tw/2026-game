"use client";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ManualTokenInput from "@/components/ui/ManualTokenInput";
import { useLoginWithToken } from "@/hooks/api";
import { scrubTokenFromCurrentUrl } from "@/lib/authUrl";
import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

const UNLOCK_TIME = new Date("2026-03-25T00:00:00+08:00");

const LOADING_PHRASES = [
	" Loading...",
	"暖機",
	"開大招",
	"蓄大絕",
	"讀取進度條",
	"快取",
	"下載 DLC",
	"解壓縮",
	"編譯",
	" build",
	"煮",
	"發酵",
	"冥想",
	"校準",
];

function PreEventMessage() {
	const [index, setIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
		}, 2000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)] px-6">
			<div className="text-center">
				<div className="mb-4 text-6xl">✦</div>
				<AnimatePresence mode="wait">
					<motion.h1
						key={index}
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: -20, opacity: 0 }}
						transition={{ duration: 0.3, ease: "easeInOut" }}
						className="font-serif text-2xl font-bold text-[var(--text-primary)] whitespace-nowrap"
					>
						大地遊戲正在{LOADING_PHRASES[index]}
					</motion.h1>
				</AnimatePresence>
				<p className="mt-4 text-[var(--text-secondary)]">
					遊戲將在年會當天解凍，敬請期待！
				</p>
			</div>
		</div>
	);
}

function LoginErrorMessage({ error }: { error: Error | null }) {
	return (
		<div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)] px-6">
			<div className="text-center">
				<div className="mb-4 text-6xl">✦</div>
				<h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">無效的登入資訊</h1>
				{error instanceof Error && <p className="mt-3 text-sm text-[var(--text-secondary)]">{error.message}</p>}
				<p className="mt-4 text-[var(--text-secondary)]">
					請重新從 OPass 登入，操作路徑為 <br />
					<code className="rounded bg-[var(--bg-header)] px-1 font-mono text-sm text-[var(--text-light)] text-nowrap">OPass APP &gt; SITCON 2026 &gt; 大地遊戲</code>
					<br />
					，或尋找現場工作人員協助。
				</p>
				<p className="mt-4 text-[var(--text-secondary)]">
					如果您尚未下載 OPass，
					<br />
					請前往{" "}
					<a href="https://opass.app" className="underline">
						https://opass.app
					</a>{" "}
					下載並使用票券登入。
				</p>
				<ManualTokenInput />
			</div>
		</div>
	);
}

function LoginContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	const { mutate: login, isPending, isError, error } = useLoginWithToken();
	const isUnlocked = new Date() >= UNLOCK_TIME;
	const attemptedTokenRef = useRef<string | null>(null);

	useEffect(() => {
		if (!token) {
			return;
		}
		if (attemptedTokenRef.current === token) {
			return;
		}

		attemptedTokenRef.current = token;
		scrubTokenFromCurrentUrl();

		login(token, {
			onSuccess: () => {
				router.push("/");
			}
		});
	}, [token, login, router]);

	if (token || isPending) {
		return <LoadingSpinner fullPage />;
	}

	if (isError) {
		if (!isUnlocked) {
			return <PreEventMessage />;
		}
		return <LoginErrorMessage error={error instanceof Error ? error : null} />;
	}

	if (!isUnlocked) {
		return <PreEventMessage />;
	}

	return <LoginErrorMessage error={null} />;
}

export default function LoginPage() {
	return (
		<Suspense fallback={<LoadingSpinner fullPage />}>
			<LoginContent />
		</Suspense>
	);
}
