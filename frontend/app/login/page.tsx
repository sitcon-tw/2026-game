"use client";

import { useEffect, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLoginWithToken } from "@/hooks/api";
import { motion, AnimatePresence } from "motion/react";

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

  const [manualToken, setManualToken] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);


  if (!token) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)] px-6">
        <div className="text-center">
          <div className="mb-4 text-6xl">✦</div>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
            無效的登入資訊
          </h1>
          <p className="mt-4 text-[var(--text-secondary)]">
            請重新從 OPass 登入，操作路徑為 <br />
            <code className="rounded bg-[var(--bg-header)] px-1 font-mono text-sm text-[var(--text-light)] text-nowrap">
              OPass APP &gt; SITCON 2026 &gt; 大地遊戲
            </code>
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
          <div className="mt-8">
            <button
              onClick={() => setShowManualInput((v) => !v)}
              className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)]"
            >
              <motion.span
                animate={{ rotate: showManualInput ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                className="inline-block text-xs"
              >
                ▶
              </motion.span>
              手動輸入票券 Token
            </button>
            <AnimatePresence initial={false}>
              {showManualInput && (
                <motion.div
                  key="manual-input"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 flex flex-col gap-2">
                    <input
                      type="text"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      placeholder="輸入 Token"
                      className="rounded-xl bg-[var(--bg-header)] px-4 py-3 font-mono text-sm text-[var(--text-light)] placeholder-[var(--text-secondary)] outline-none"
                    />
                    <button
                      onClick={() => {
                        if (manualToken.trim()) {
                          router.push(
                            `/login?token=${encodeURIComponent(manualToken.trim())}`,
                          );
                        }
                      }}
                      className="rounded-xl bg-[#AC8B58] px-6 py-3 font-medium text-[var(--text-light)] transition-opacity hover:opacity-90"
                    >
                      登入
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
          <p className="mt-4 text-[var(--text-secondary)]">
            目前使用的 Token：
            <br />
            <code className="mt-1 inline-block rounded bg-[var(--bg-header)] px-2 py-1 font-mono text-sm text-[var(--text-light)] break-all">
              {token}
            </code>
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-[var(--bg-header)] px-6 py-3 font-medium text-[var(--text-light)] transition-opacity hover:opacity-90"
            >
              重試
            </button>
            <button
              onClick={() => router.push("/login")}
              className="rounded-xl bg-[var(--bg-header)] px-6 py-3 font-medium text-[var(--text-light)] transition-opacity hover:opacity-90"
            >
              返回登入頁
            </button>
          </div>
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
