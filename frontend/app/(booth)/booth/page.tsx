"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useBoothLogin, useBoothStats, useBoothCheckin } from "@/hooks/api";
import { useBoothStore } from "@/stores";
import { translateWithContext, isSuccessStatus } from "@/lib/scanMessages";
import type { ScanStatus } from "@/lib/scanMessages";
import QrScanner from "@/components/QrScanner";

function BoothScanContent() {
    const [scanStatus, setScanStatus] = useState<ScanStatus>({ type: "idle" });
    const router = useRouter();
    const searchParams = useSearchParams();

    // Booth store
    const { boothToken, boothName, boothDescription, setBoothToken, setBoothName, setBoothDescription } = useBoothStore();

    // API hooks
    const boothLogin = useBoothLogin();
    const { data: boothStats, isLoading: statsLoading } = useBoothStats();
    const boothCheckin = useBoothCheckin();

    // ── 1. Read token from URL and login ──
    useEffect(() => {
        const tokenFromUrl = searchParams.get("token");
        if (tokenFromUrl) {
            // Save token and login
            setBoothToken(tokenFromUrl);
            boothLogin.mutate(tokenFromUrl, {
                onSuccess: (data: any) => {
                    if (data?.name) setBoothName(data.name);
                    if (data?.description) setBoothDescription(data.description);
                },
                onError: (error) => {
                    console.error("Booth login failed:", error);
                    setScanStatus({
                        type: "error",
                        message: translateWithContext("booth-login", error instanceof Error ? error.message : undefined, "攤位登入失敗，請確認連結是否正確"),
                    });
                },
            });
        } else if (!boothToken) {
            // No token in URL and no stored token — cannot operate
            setScanStatus({
                type: "error",
                message: "缺少攤位 token，請使用正確連結進入",
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // ── 2. Handle QR scan → booth check-in ──
    const handleScan = useCallback(
        (result: { rawValue: string }[]) => {
            if (!result.length) return;
            // Prevent duplicate scans while processing
            if (
                scanStatus.type === "scanning" ||
                boothCheckin.isPending
            )
                return;

            const userQRCode = result[0].rawValue;
            console.log("Scanned user QR:", userQRCode);
            setScanStatus({ type: "scanning" });

            boothCheckin.mutate(userQRCode, {
                onSuccess: (data) => {
                    const msg = translateWithContext("booth-checkin", data?.status, "打卡成功！");
                    setScanStatus({ type: isSuccessStatus(data?.status) ? "success" : "error", message: msg });
                    setTimeout(() => setScanStatus({ type: "idle" }), 2000);
                },
                onError: (error) => {
                    const msg = translateWithContext("booth-checkin", error instanceof Error ? error.message : undefined, "打卡失敗，請重試");
                    setScanStatus({ type: "error", message: msg });
                    setTimeout(() => setScanStatus({ type: "idle" }), 3000);
                },
            });
        },
        [scanStatus, boothCheckin]
    );

    // ── Render ──
    const visitorCount = boothStats?.count ?? 0;

    return (
        <div className="flex flex-1 flex-col items-center px-6 py-8">
            {/* Title */}
            <h1 className="font-serif text-3xl font-bold text-[var(--text-primary)] text-center leading-snug">
                {boothName ?? "攤位掃描器"}
            </h1>
            {boothDescription && (
                <p className="mt-2 text-sm text-[var(--text-secondary)] text-center max-w-[300px]">
                    {boothDescription}
                </p>
            )}

            {/* Login error */}
            {boothLogin.isError && (
                <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-red-700 text-sm w-full max-w-[300px] text-center">
                    攤位登入失敗，請確認連結是否正確
                </div>
            )}

            {/* Scanner area */}
            <div className="my-8">
                <QrScanner onScan={handleScan} scanStatus={scanStatus} />
            </div>

            {/* Visitor count */}
            <h2 className="font-serif text-2xl text-[var(--text-primary)] text-center mt-2">
                {statsLoading ? "載入中…" : `${visitorCount} 人來過`}
            </h2>

            {/* Identity Switcher Button */}
            <button
                type="button"
                onClick={() => {
                    router.push("/play");
                }}
                className="fixed bottom-20 right-6 z-50 flex flex-col items-center gap-1 transition-transform active:scale-95"
                aria-label="切換身份"
            >
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[#59360B] shadow-lg">
                    <Image
                        src="/assets/switch.svg"
                        alt="Switch"
                        width={32}
                        height={32}
                    />
                </div>
                <span className="font-serif text-lg font-bold text-[var(--text-primary)] whitespace-nowrap">
                    玩家 / 攤位
                </span>
            </button>
        </div>
    );
}

export default function BoothScanPage() {
    return (
        <Suspense
            fallback={
                <div className="flex flex-1 items-center justify-center">
                    <div className="text-lg text-[var(--text-primary)]">載入中...</div>
                </div>
            }
        >
            <BoothScanContent />
        </Suspense>
    );
}
