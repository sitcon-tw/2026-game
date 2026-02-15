"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import type { ScanStatus } from "@/lib/scanMessages";

interface QrScannerProps {
    onScan: (result: { rawValue: string }[]) => void;
    scanStatus: ScanStatus;
    /** Optional content to show instead of the scanner (e.g. "My QR Code" view) */
    alternateContent?: ReactNode;
    /** When true, show alternateContent instead of the camera */
    showAlternate?: boolean;
}

export default function QrScanner({
    onScan,
    scanStatus,
    alternateContent,
    showAlternate = false,
}: QrScannerProps) {
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(
        undefined
    );

    // ── Camera setup ──
    useEffect(() => {
        if (!navigator.mediaDevices?.enumerateDevices) return;

        navigator.mediaDevices
            .enumerateDevices()
            .then((devices) => {
                const videoDevices = devices.filter(
                    (d) => d.kind === "videoinput"
                );
                setCameras(videoDevices);
                if (videoDevices.length > 0) {
                    setSelectedDeviceId(
                        videoDevices[videoDevices.length - 1].deviceId
                    );
                }
            })
            .catch(console.error);
    }, []);

    const flipCamera = () => {
        if (cameras.length < 2) return;
        const currentIdx = cameras.findIndex(
            (c) => c.deviceId === selectedDeviceId
        );
        const nextIdx = (currentIdx + 1) % cameras.length;
        setSelectedDeviceId(cameras[nextIdx].deviceId);
    };

    const showScanner = !showAlternate;

    return (
        <div className="relative w-full max-w-[300px] aspect-square rounded-lg overflow-hidden bg-[#6b6b6b]">
            {/* Flip camera button */}
            {showScanner && cameras.length > 1 && (
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

            {showAlternate && alternateContent ? (
                alternateContent
            ) : (
                <Scanner
                    key={selectedDeviceId}
                    onScan={scanStatus.type === "idle" ? onScan : () => {}}
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

            {/* Scan status overlay */}
            {showScanner && scanStatus.type === "scanning" && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
                    <div className="rounded-lg bg-white px-6 py-3 text-lg font-bold text-[var(--text-primary)]">
                        處理中…
                    </div>
                </div>
            )}
            {showScanner && scanStatus.type === "success" && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
                    <div className="rounded-lg bg-green-500 px-6 py-3 text-lg font-bold text-white">
                        {scanStatus.message}
                    </div>
                </div>
            )}
            {showScanner && scanStatus.type === "error" && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
                    <div className="rounded-lg bg-red-500 px-6 py-3 text-lg font-bold text-white text-center">
                        {scanStatus.message}
                    </div>
                </div>
            )}
        </div>
    );
}
