"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
    { href: "/levels", label: "關卡", icon: "🎵" },
    { href: "/unlock", label: "解鎖", icon: "🔄" },
    { href: "/leaderboard", label: "排行榜", icon: "👥" },
    { href: "/scanner", label: "掃描", icon: "📱" },
    { href: "/profile", label: "個人", icon: "👤" },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 bg-[var(--bg-header)] pb-[env(safe-area-inset-bottom)]">
            <div className="flex h-[var(--navbar-height)] items-center justify-around">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 text-xs ${isActive
                                    ? "text-[var(--accent-gold)]"
                                    : "text-[var(--text-light)]/70"
                                }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
