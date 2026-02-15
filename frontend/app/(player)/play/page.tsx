'use client';

import { useRouter } from 'next/navigation';
import UnlockMethodCard from '@/components/unlock/UnlockMethodCard';
import { useActivityStats, useFriendCount } from '@/hooks/api';
import { useMemo } from 'react';

export default function PlayPage() {
    const router = useRouter();
    const { data: activities } = useActivityStats();
    const { data: friendData } = useFriendCount();

    const counts = useMemo(() => {
        if (!activities) return { booth: { current: 0, total: 0 }, challenge: { current: 0, total: 0 }, checkin: { current: 0, total: 0 } };
        const result: Record<string, { current: number; total: number }> = {};
        for (const type of ['booth', 'challenge', 'checkin']) {
            const items = activities.filter((a) => a.type === type);
            result[type] = {
                current: items.filter((a) => a.visited).length,
                total: items.length,
            };
        }
        return result;
    }, [activities]);

    const unlockMethods = [
        {
            title: '攤位',
            current: counts.booth?.current ?? 0,
            total: counts.booth?.total ?? 0,
            route: '/play/booths',
        },
        {
            title: '闖關',
            current: counts.challenge?.current ?? 0,
            total: counts.challenge?.total ?? 0,
            route: '/play/challenges',
        },
        {
            title: '打卡',
            current: counts.checkin?.current ?? 0,
            total: counts.checkin?.total ?? 0,
            route: '/play/checkins',
        },
        {
            title: '認識新朋友',
            current: friendData?.count ?? 0,
            total: friendData?.max ?? 20,
            route: '/scan',
        },
    ];

    return (
        <div className="bg-[var(--bg-primary)] px-6 py-8">
            {/* Title */}
            <h1 className="text-[var(--text-primary)] text-3xl font-serif font-bold text-center mb-8">
                解鎖關卡的方式
            </h1>

            {/* Unlock Method Cards */}
            <div className="max-w-[430px] mx-auto space-y-4">
                {unlockMethods.map((method, index) => (
                    <UnlockMethodCard
                        key={index}
                        title={method.title}
                        current={method.current}
                        total={method.total}
                        onClick={() => router.push(method.route)}
                    />
                ))}
            </div>
        </div>
    );
}
