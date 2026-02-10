"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Scanner } from "@yudiel/react-qr-scanner";

export default function BoothScanPage() {
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
                攤位掃描器
            </h1>
            <h2 className="font-serif text-2xl text-[var(--text-primary)] text-center mt-2">
                電繪版社
            </h2>

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

            </div>
            <h2 className="font-serif text-2xl text-[var(--text-primary)] text-center mt-2">
                20 人來過
            </h2>

            {/* Identity Switcher Button */}
            <button
                type="button"
                onClick={() => {
                    // TODO: handle identity switch
                    console.log("Switch identity");
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
