"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
    { href: "/levels", label: "關卡", icon: "/assets/navigation/1-puzzle.svg" },
    { href: "/play", label: "闖關", icon: "/assets/navigation/2-book.svg" },
    { href: "/scan", label: "會眾掃描", icon: "/assets/navigation/3-scanner.svg" },
    { href: "/leaderboard", label: "排行榜", icon: "/assets/navigation/4-challenge.svg" },
    { href: "/coupon", label: "折價券", icon: "/assets/navigation/5-ticket.svg" },
];

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 bg-[var(--bg-header)] pb-[env(safe-area-inset-bottom)]">
            <div className="flex h-[var(--navbar-height)] items-center justify-around">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <button
                            key={item.href}
                            type="button"
                            onClick={() => router.push(item.href)}
                            className="flex items-center justify-center"
                        >
                            <div
                                className={`flex items-center justify-center rounded-full w-10 h-10 transition-all ${isActive
                                    ? "bg-[#D9BD8B]"
                                    : "bg-transparent"
                                    }`}
                            >
                                <Image
                                    src={item.icon}
                                    alt={item.label}
                                    width={24}
                                    height={24}
                                    className="p-[0.5px]"
                                    style={{
                                        filter: isActive
                                            ? "brightness(0.35) saturate(0.85) hue-rotate(-5deg)"
                                            : "none",
                                        // opacity: isActive ? 1 : 0.6,
                                    }}
                                />
                            </div>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
