"use client";

import { useState, useCallback } from "react";
import { useCurrentUser, useFriendCount, useAddFriend, useCheckinActivity } from "@/hooks/api";
import { translateWithContext, isSuccessStatus } from "@/lib/scanMessages";
import type { ScanStatus } from "@/lib/scanMessages";
import QrScanner from "@/components/QrScanner";

export default function ScanPage() {
    const [showMyQR, setShowMyQR] = useState(false);
    const [scanStatus, setScanStatus] = useState<ScanStatus>({ type: "idle" });

    const { data: user } = useCurrentUser();
    const { data: friendData } = useFriendCount();
    const addFriend = useAddFriend();
    const checkinActivity = useCheckinActivity();

    const friendCount = friendData?.count ?? 0;
    const friendLimit = friendData?.max ?? 20;
    const remaining = friendLimit - friendCount;
    const progress = friendLimit > 0 ? friendCount / friendLimit : 0;

    const handleScan = useCallback(
        (result: { rawValue: string }[]) => {
            if (!result.length) return;
            // Prevent duplicate scans while processing
            if (
                scanStatus.type === "scanning" ||
                addFriend.isPending ||
                checkinActivity.isPending
            )
                return;

            const value = result[0].rawValue;
            console.log("Scanned QR:", value);
            setScanStatus({ type: "scanning" });

            // Try adding as friend first; if the QR looks like an activity code, use checkin
            if (value.startsWith("activity:")) {
                checkinActivity.mutate(value, {
                    onSuccess: (data) => {
                        const msg = translateWithContext("activity-checkin", data?.status, "打卡成功！");
                        setScanStatus({ type: isSuccessStatus(data?.status) ? "success" : "error", message: msg });
                        setTimeout(() => setScanStatus({ type: "idle" }), 2000);
                    },
                    onError: (err) => {
                        const msg = translateWithContext("activity-checkin", err instanceof Error ? err.message : undefined, "打卡失敗，請重試");
                        setScanStatus({ type: "error", message: msg });
                        setTimeout(() => setScanStatus({ type: "idle" }), 3000);
                    },
                });
            } else {
                addFriend.mutate(value, {
                    onSuccess: () => {
                        setScanStatus({ type: "success", message: translateWithContext("friendship", "friendship created") });
                        setTimeout(() => setScanStatus({ type: "idle" }), 2000);
                    },
                    onError: (err) => {
                        const msg = translateWithContext("friendship", err instanceof Error ? err.message : undefined, "加朋友失敗，請重試");
                        setScanStatus({ type: "error", message: msg });
                        setTimeout(() => setScanStatus({ type: "idle" }), 3000);
                    },
                });
            }
        },
        [scanStatus, addFriend, checkinActivity]
    );

    return (
        <div className="flex flex-1 flex-col items-center px-6 py-8">
            {/* Title */}
            <h1 className="font-serif text-3xl font-bold text-[var(--text-primary)] text-center leading-snug">
                掃描 QR Code
                <br />
                獲得碎片
            </h1>

            {/* Scanner / My QR toggle area */}
            <div className="mt-8">
                <QrScanner
                    onScan={handleScan}
                    scanStatus={scanStatus}
                    showAlternate={showMyQR}
                    alternateContent={
                        <div className="flex h-full w-full items-center justify-center bg-[var(--bg-secondary)]">
                            <div className="flex flex-col items-center gap-3 p-10">
                                {user?.qrcode_token ? (
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${encodeURIComponent(user.qrcode_token)}`}
                                        alt="我的 QR Code"
                                        className="h-48 w-48 rounded-md"
                                    />
                                ) : (
                                    <div className="h-48 w-48 animate-pulse rounded-md bg-[#6b6b6b]" />
                                )}
                                <span className="text-sm text-[var(--text-secondary)]">
                                    讓朋友掃描你的 QR Code
                                </span>
                            </div>
                        </div>
                    }
                />
            </div>

            {/* Friend remaining info */}
            <p className="mt-6 text-center font-serif text-base text-[var(--text-secondary)] leading-relaxed">
                在你逛更多攤位以前
                <br />
                還可認識{" "}
                {friendData ? (
                    <span className="font-semibold text-[var(--text-primary)]">
                        {remaining}
                    </span>
                ) : (
                    <span className="inline-block h-4 w-6 animate-pulse rounded bg-current opacity-20 align-middle" />
                )}{" "}
                位朋友
            </p>

            {/* Progress bar */}
            <div className={`mt-3 h-2.5 w-40 overflow-hidden rounded-full bg-[rgba(93,64,55,0.2)]${!friendData ? " animate-pulse" : ""}`}>
                <div
                    className="h-full rounded-full bg-[var(--text-primary)] transition-all"
                    style={{ width: `${progress * 100}%` }}
                />
            </div>

            {/* My QR Code toggle button */}
            <button
                type="button"
                onClick={() => setShowMyQR((prev) => !prev)}
                className="mt-8 rounded-full bg-[var(--bg-header)] px-8 py-3 font-serif text-lg font-semibold text-[var(--text-light)] shadow-md transition-transform active:scale-95"
            >
                {showMyQR ? "掃描 QR Code" : "我的 QR Code"}
            </button>
        </div>
    );
}
