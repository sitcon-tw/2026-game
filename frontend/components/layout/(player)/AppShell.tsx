"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/(player)/Header";
import BottomNav from "@/components/layout/(player)/BottomNav";
import AuthGuard from "@/components/providers/AuthGuard";
import { useCouponPolling } from "@/hooks/useCouponPolling";

const HIDE_SHELL_PATHS = new Set(["/"]);

function PlayerShell({ children }: { children: React.ReactNode }) {
  useCouponPolling();

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

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideShell = HIDE_SHELL_PATHS.has(pathname);

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <AuthGuard>
      <PlayerShell>{children}</PlayerShell>
    </AuthGuard>
  );
}
