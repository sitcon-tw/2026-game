"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLoginWithToken } from "@/hooks/api";
import { motion } from "motion/react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { mutate: login, isPending, isError, error } = useLoginWithToken();

  useEffect(() => {
    if (!token) {
      return;
    }

    login(token, {
      onSuccess: () => {
        router.push("/");
      },
    });
  }, [token, login, router]);

  if (!token) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)] px-6">
        <div className="text-center">
          <div className="mb-4 text-6xl">✦</div>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
            無效的登入資訊
          </h1>
          <p className="mt-4 text-[var(--text-secondary)]">
            請重新從 OPass 登入，操作路徑為 <code className="rounded bg-[var(--bg-header)] px-1 font-mono text-sm text-[var(--text-light)] text-nowrap">OPass APP &gt; SITCON 2026 &gt; 大地遊戲</code>，或尋找現場工作人員協助。
          </p>
          <p className="mt-4 text-[var(--text-secondary)]">
            如果您尚未下載 OPass，請前往 <a href="https://opass.app" className="underline">https://opass.app</a> 下載並使用票券登入。
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)] px-6">
        <div className="text-center">
          <div className="mb-4 text-6xl text-[var(--status-error)]">✕</div>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
            登入失敗
          </h1>
          <p className="mt-4 text-[var(--text-secondary)]">
            {error instanceof Error ? error.message : "請稍後再試"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-[var(--bg-header)] px-6 py-3 font-medium text-[var(--text-light)] transition-opacity hover:opacity-90"
          >
            重試
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)] px-6">
      <div className="text-center">
        <motion.img
          src="/assets/landing/album-cd.svg"
          alt="Loading"
          className="mb-6 inline-block w-16 h-16"
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
          登入中...
        </h1>
        <p className="mt-4 text-[var(--text-secondary)]">請稍候</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)] px-6">
          <div className="text-center">
            <motion.img
              src="/assets/landing/album-cd.svg"
              alt="Loading"
              className="mb-6 inline-block w-16 h-16"
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
              載入中...
            </h1>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
