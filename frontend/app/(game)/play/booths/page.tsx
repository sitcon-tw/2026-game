'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Booth {
    id: string;
    name: string;
    description: string;
    location: string;
    image: string;
    visited: boolean;
}

// Mock booth data — replace with real data source
const BOOTHS: Booth[] = [
    { id: '1', name: 'SITCON', description: '學生計算機年會社群攤位', location: '2F 1 號攤位', image: '/assets/booths/example-map.png', visited: false },
    { id: '2', name: 'SITCON', description: '學生計算機年會社群攤位', location: '2F 2 號攤位', image: '/assets/booths/example-map.png', visited: false },
    { id: '3', name: 'SITCON', description: '學生計算機年會社群攤位', location: '2F 3 號攤位', image: '/assets/booths/example-map.png', visited: true },
    { id: '4', name: 'SITCON', description: '學生計算機年會社群攤位', location: '2F 4 號攤位', image: '/assets/booths/example-map.png', visited: false },
    { id: '5', name: 'SITCON', description: '學生計算機年會社群攤位', location: '2F 5 號攤位', image: '/assets/booths/example-map.png', visited: false },
    { id: '6', name: 'SITCON', description: '學生計算機年會社群攤位', location: '2F 6 號攤位', image: '/assets/booths/example-map.png', visited: true },
    { id: '7', name: 'SITCON', description: '學生計算機年會社群攤位', location: '2F 7 號攤位', image: '/assets/booths/example-map.png', visited: false },
    { id: '8', name: 'SITCON', description: '學生計算機年會社群攤位', location: '2F 8 號攤位', image: '/assets/booths/example-map.png', visited: false },
    { id: '9', name: 'SITCON', description: '學生計算機年會社群攤位', location: '2F 9 號攤位', image: '/assets/booths/example-map.png', visited: false },
    { id: '10', name: 'SITCON', description: '學生計算機年會社群攤位', location: '2F 10 號攤位', image: '/assets/booths/example-map.png', visited: false },
    { id: '11', name: 'SITCON', description: '學生計算機年會社群攤位', location: '2F 11 號攤位', image: '/assets/booths/example-map.png', visited: false },
    { id: '12', name: 'SITCON', description: '學生計算機年會社群攤位', location: '2F 12 號攤位', image: '/assets/booths/example-map.png', visited: false },
];

export default function BoothsPage() {
    const router = useRouter();
    const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] px-6 py-6">
            {/* Back Button */}
            <button
                type="button"
                onClick={() => router.back()}
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-primary)] text-2xl"
                aria-label="返回"
            >
                ←
            </button>

            {/* Title */}
            <h1 className="text-[var(--text-primary)] text-3xl font-serif font-bold text-center mb-6">
                可解鎖攤位
            </h1>

            {/* Booth Grid — 2 columns × N rows */}
            <div className="max-w-[430px] mx-auto grid grid-cols-2 gap-3">
                {BOOTHS.map((booth) => (
                    <button
                        key={booth.id}
                        type="button"
                        onClick={() => setSelectedBooth(booth)}
                        className={`
              flex items-center justify-center rounded-[var(--border-radius)] px-4 py-5
              font-serif text-xl font-semibold tracking-wide transition-all cursor-pointer
              ${booth.visited
                                ? 'bg-[var(--accent-gold)] text-white shadow-md'
                                : 'bg-[var(--bg-secondary)] text-[var(--text-light)] opacity-70'
                            }
            `}
                    >
                        {booth.name}
                    </button>
                ))}
            </div>

            {/* Booth Detail Modal */}
            {selectedBooth && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
                    onClick={() => setSelectedBooth(null)}
                >
                    <div
                        className="w-full max-w-[380px] rounded-2xl bg-white p-8 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Booth Name */}
                        <h2 className="text-center font-serif text-3xl font-bold text-[var(--text-primary)] mb-2">
                            {selectedBooth.name}
                        </h2>

                        {/* Location */}
                        <p className="text-center text-lg text-[var(--text-secondary)] mb-6">
                            {selectedBooth.location}
                        </p>

                        {/* Map Image */}
                        <div className="relative mx-auto mb-8 aspect-[4/3] w-full overflow-hidden rounded-lg">
                            <Image
                                src={selectedBooth.image}
                                alt={`${selectedBooth.name} 地圖`}
                                fill
                                className="object-contain"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    // TODO: navigate to booth detail / introduction
                                }}
                                className="flex-1 rounded-full bg-[var(--bg-header)] py-3 text-center font-serif text-xl font-semibold text-[var(--text-light)] transition-opacity hover:opacity-90"
                            >
                                介紹
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    // TODO: confirm / check-in logic
                                    setSelectedBooth(null);
                                }}
                                className="flex-1 rounded-full bg-[var(--bg-header)] py-3 text-center font-serif text-xl font-semibold text-[var(--text-light)] transition-opacity hover:opacity-90"
                            >
                                確認
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
