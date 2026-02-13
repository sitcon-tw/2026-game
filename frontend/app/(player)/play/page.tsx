'use client';

import { useRouter } from 'next/navigation';
import UnlockMethodCard from '@/components/unlock/UnlockMethodCard';

export default function PlayPage() {
    const router = useRouter();

    const unlockMethods = [
        {
            title: '攤位',
            current: 20,
            total: 30,
            route: '/play/booths',
        },
        {
            title: '闖關',
            current: 0,
            total: 1,
            route: '/play/challenges',
        },
        {
            title: '打卡',
            current: 20,
            total: 30,
            route: '/play/checkins',
        },
        {
            title: '認識新朋友',
            current: 20,
            total: 1400,
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
