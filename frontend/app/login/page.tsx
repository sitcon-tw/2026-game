"use client";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ManualTokenInput from "@/components/ui/ManualTokenInput";
import { useLoginWithToken } from "@/hooks/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const UNLOCK_TIME = new Date("2026-03-25T00:00:00+08:00");

function PreEventMessage() {
	return (
		<div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)] px-6">
			<div className="text-center">
				<div className="mb-4 text-6xl">✦</div>
				<h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">大地遊戲尚未開放</h1>
				<p className="mt-4 text-[var(--text-secondary)]">
					遊戲將在年會當天解鎖，敬請期待！
				</p>
			</div>
		</div>
	);
}

function LoginErrorMessage({ token, error }: { token: string | null; error: Error | null }) {
	return (
		<div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)] px-6">
			<div className="text-center">
				<div className="mb-4 text-6xl">✦</div>
				<h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">無效的登入資訊</h1>
				{token && (
					<div className="mt-5 rounded-lg border border-[var(--status-error)]/30 bg-[var(--status-error)]/10 px-4 py-3">
						<p className="text-sm font-medium text-[var(--status-error)]">{error instanceof Error ? error.message : "請稍後再試"}</p>
						<p className="mt-2 text-xs text-[var(--text-secondary)]">
							Token：<code className="rounded bg-[var(--bg-header)] px-1.5 py-0.5 font-mono text-[var(--text-light)] break-all">{token}</code>
						</p>
					</div>
				)}
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

	useEffect(() => {
		if (!token) {
			return;
		}

		login(token, {
			onSuccess: () => {
				router.push("/");
			}
		});
	}, [token, login, router]);

	if (!token || isError) {
		if (!isUnlocked) {
			return <PreEventMessage />;
		}
		return <LoginErrorMessage token={token} error={error instanceof Error ? error : null} />;
	}

	return <LoadingSpinner fullPage />;
}

export default function LoginPage() {
	return (
		<Suspense fallback={<LoadingSpinner fullPage />}>
			<LoginContent />
		</Suspense>
	);
}
