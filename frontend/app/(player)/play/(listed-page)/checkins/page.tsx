'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useActivityStats } from '@/hooks/api';
import type { ActivityWithStatus } from '@/types/api';

export default function CheckinsPage() {
    const { data: activities, isLoading } = useActivityStats();
    const [selectedItem, setSelectedItem] = useState<ActivityWithStatus | null>(null);

    const checkins = useMemo(
        () => (activities ?? []).filter((a) => a.type === 'checkin'),
        [activities]
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="mb-4 inline-block animate-spin text-4xl text-[var(--text-gold)]">
                        ✦
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">載入中…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[var(--bg-primary)] px-6 py-6">
            {/* Title */}
            <h1 className="text-[var(--text-primary)] text-3xl font-serif font-bold text-center mb-6">
                打卡地點
            </h1>

            {/* Grid — 2 columns × N rows */}
            <div className="grid grid-cols-2 gap-3">
                {checkins.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className={`
              flex items-center justify-center px-4 py-5
              font-serif text-xl font-semibold tracking-wide transition-all cursor-pointer
              ${item.visited
                                ? 'bg-[var(--accent-bronze)] text-white'
                                : 'bg-[#C6A97B] text-[var(--text-light)] opacity-70'
                            }
            `}
                    >
                        {item.name}
                    </button>
                ))}
            </div>

            {/* Detail Modal */}
            {selectedItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
                    onClick={() => setSelectedItem(null)}
                >
                    <div
                        className="w-full max-w-[380px] rounded-2xl bg-white p-8 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-center font-serif text-3xl font-bold text-[var(--text-primary)] mb-2">
                            {selectedItem.name}
                        </h2>
                        <p className="text-center text-lg text-[var(--text-secondary)] mb-6">
                            {selectedItem.visited ? '已打卡' : '未打卡'}
                        </p>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setSelectedItem(null)}
                                className="flex-1 rounded-full bg-[var(--bg-header)] py-3 text-center font-serif text-xl font-semibold text-[var(--text-light)] transition-opacity hover:opacity-90"
                            >
                                關閉
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
