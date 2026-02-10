"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Scanner } from "@yudiel/react-qr-scanner";

const FRIEND_LIMIT = 20;

export default function ScanPage() {
    const router = useRouter();
    const [showMyQR, setShowMyQR] = useState(false);
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);

    useEffect(() => {
        navigator.mediaDevices
            .enumerateDevices()
            .then((devices) => {
                const videoDevices = devices.filter((d) => d.kind === "videoinput");
                setCameras(videoDevices);
                // Default to the last camera (usually back-facing on mobile)
                if (videoDevices.length > 0) {
                    setSelectedDeviceId(videoDevices[videoDevices.length - 1].deviceId);
                }
            })
            .catch(console.error);
    }, []);

    // TODO: replace with real user data from store
    const friendCount = 17;
    const remaining = FRIEND_LIMIT - friendCount;
    const progress = friendCount / FRIEND_LIMIT;

    const flipCamera = () => {
        if (cameras.length < 2) return;
        const currentIdx = cameras.findIndex((c) => c.deviceId === selectedDeviceId);
        const nextIdx = (currentIdx + 1) % cameras.length;
        setSelectedDeviceId(cameras[nextIdx].deviceId);
    };

    const handleScan = (result: { rawValue: string }[]) => {
        if (!result.length) return;
        const value = result[0].rawValue;
        console.log("Scanned:", value);
        // TODO: handle scanned QR code value (unlock level, add friend, etc.)
    };

    return (
        <div className="flex flex-1 flex-col items-center px-6 py-8">
            {/* Title */}
            <h1 className="font-serif text-3xl font-bold text-[var(--text-primary)] text-center leading-snug">
                掃描 QR Code
                <br />
                獲得碎片
            </h1>

            {/* Scanner / My QR toggle area */}
            <div className="relative mt-8 w-full max-w-[300px] aspect-square rounded-lg overflow-hidden bg-[#6b6b6b]">
                {/* Flip camera button */}
                {!showMyQR && cameras.length > 1 && (
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
                {showMyQR ? (
                    <div className="flex h-full w-full items-center justify-center bg-[var(--bg-secondary)]">
                        {/* TODO: replace with real user QR code */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-48 w-48 rounded-md bg-[#6b6b6b]" />
                            <span className="text-sm text-[var(--text-secondary)]">
                                讓朋友掃描你的 QR Code
                            </span>
                        </div>
                    </div>
                ) : (
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
                )}
            </div>

            {/* Friend remaining info */}
            <p className="mt-6 text-center font-serif text-base text-[var(--text-secondary)] leading-relaxed">
                在你逛更多攤位以前
                <br />
                還可認識{" "}
                <span className="font-semibold text-[var(--text-primary)]">
                    {remaining}
                </span>{" "}
                位朋友
            </p>

            {/* Progress bar */}
            <div className="mt-3 h-2.5 w-40 overflow-hidden rounded-full bg-[rgba(93,64,55,0.2)]">
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
