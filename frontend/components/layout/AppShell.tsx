"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

const HIDE_SHELL_PATHS = new Set(["/"]);

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const hideShell = HIDE_SHELL_PATHS.has(pathname);

    if (hideShell) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-dvh max-w-[430px] flex-col mx-auto">
            <Header />
            <main className="flex-1 overflow-y-auto pb-[var(--navbar-height)]">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
