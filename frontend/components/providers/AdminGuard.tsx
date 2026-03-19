"use client";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { api, ApiError } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
	const router = useRouter();

	const { isLoading, isError, error } = useQuery({
		queryKey: ["admin", "session-guard"],
		queryFn: () => api.get<unknown[]>("/admin/gift-coupons"),
		retry: false
	});

	useEffect(() => {
		if (isError && error instanceof ApiError && error.status === 401) {
			router.replace("/admin");
		}
	}, [isError, error, router]);

	if (isLoading) {
		return <LoadingSpinner fullPage />;
	}

	if (isError && error instanceof ApiError && error.status === 401) {
		return null;
	}

	if (isError) {
		return (
			<div className="flex min-h-dvh items-center justify-center px-6">
				<div className="max-w-sm rounded-2xl bg-red-50 px-5 py-4 text-center ring-1 ring-red-200">
					<p className="font-serif font-bold text-red-800">無法驗證管理員權限</p>
					<p className="mt-1 text-sm text-red-600">請重新整理頁面後再試</p>
				</div>
			</div>
		);
	}

	return <>{children}</>;
}
