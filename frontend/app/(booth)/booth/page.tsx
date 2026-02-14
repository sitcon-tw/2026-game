"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Image from "next/image";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useRouter, useSearchParams } from "next/navigation";
import { useBoothLogin, useBoothStats, useBoothCheckin } from "@/hooks/api";
import { useBoothStore } from "@/stores";
import { translateWithContext, isSuccessStatus } from "@/lib/scanMessages";
import type { ScanStatus } from "@/lib/scanMessages";

function BoothScanContent() {
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(
        undefined
    );
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

    // ── 2. Camera setup ──
    useEffect(() => {
        navigator.mediaDevices
            .enumerateDevices()
            .then((devices) => {
                const videoDevices = devices.filter((d) => d.kind === "videoinput");
                setCameras(videoDevices);
                if (videoDevices.length > 0) {
                    setSelectedDeviceId(videoDevices[videoDevices.length - 1].deviceId);
                }
            })
            .catch(console.error);
    }, []);

    const stopCamera = () => {
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                stream.getTracks().forEach((track) => track.stop());
            })
            .catch(() => {
                /* Camera may not be active */
            });
    };

    const flipCamera = () => {
        if (cameras.length < 2) return;
        const currentIdx = cameras.findIndex(
            (c) => c.deviceId === selectedDeviceId
        );
        const nextIdx = (currentIdx + 1) % cameras.length;
        setSelectedDeviceId(cameras[nextIdx].deviceId);
    };

    // ── 3. Handle QR scan → booth check-in ──
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
    const isLoggedIn = boothToken || boothLogin.isSuccess;

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
            <div className="relative my-8 w-full max-w-[300px] aspect-square rounded-lg overflow-hidden bg-[#6b6b6b]">
                {/* Flip camera button */}
                {cameras.length > 1 && (
                    <button
                        type="button"
                        onClick={flipCamera}
                        className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-[rgba(0,0,0,0.45)] text-white backdrop-blur-sm transition-transform active:scale-90"
                        aria-label="切換鏡頭"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5"
                        >
                            <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
                            <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
                            <circle cx="12" cy="12" r="3" />
                            <path d="m18 22-3-3 3-3" />
                            <path d="m6 2 3 3-3 3" />
                        </svg>
                    </button>
                )}

                <Scanner
                    key={selectedDeviceId}
                    onScan={handleScan}
                    onError={(error) => console.error(error)}
                    constraints={{
                        deviceId: selectedDeviceId
                            ? { exact: selectedDeviceId }
                            : undefined,
                    }}
                    styles={{
                        container: {
                            width: "100%",
                            height: "100%",
                        },
                        video: {
                            objectFit: "cover",
                        },
                    }}
                    components={{
                        finder: true,
                    }}
                />

                {/* Scan status overlay */}
                {scanStatus.type === "scanning" && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
                        <div className="rounded-lg bg-white px-6 py-3 text-lg font-bold text-[var(--text-primary)]">
                            處理中…
                        </div>
                    </div>
                )}
                {scanStatus.type === "success" && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
                        <div className="rounded-lg bg-green-500 px-6 py-3 text-lg font-bold text-white">
                            {scanStatus.message}
                        </div>
                    </div>
                )}
                {scanStatus.type === "error" && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
                        <div className="rounded-lg bg-red-500 px-6 py-3 text-lg font-bold text-white text-center">
                            {scanStatus.message}
                        </div>
                    </div>
                )}
            </div>

            {/* Visitor count */}
            <h2 className="font-serif text-2xl text-[var(--text-primary)] text-center mt-2">
                {statsLoading ? "載入中…" : `${visitorCount} 人來過`}
            </h2>

            {/* Identity Switcher Button */}
            <button
                type="button"
                onClick={() => {
                    stopCamera();
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
