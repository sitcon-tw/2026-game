"use client";

import BottomNav from "@/components/layout/(player)/BottomNav";
import Header from "@/components/layout/(player)/Header";
import AuthGuard from "@/components/providers/AuthGuard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useCouponPolling } from "@/hooks/useCouponPolling";
import { useScheduledNotifications } from "@/hooks/useScheduledNotifications";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const HIDE_SHELL_PATHS = new Set(["/"]);

function PlayerShell({ children }: { children: React.ReactNode }) {
	useCouponPolling();
	useScheduledNotifications();

	return (
		<div className="flex h-dvh max-w-[430px] flex-col mx-auto">
			<Header />
			<main className="flex-1 overflow-y-auto pb-[var(--navbar-height)]">{children}</main>
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
		<Suspense fallback={<LoadingSpinner fullPage />}>
			<AuthGuard>
				<PlayerShell>{children}</PlayerShell>
			</AuthGuard>
		</Suspense>
	);
}
