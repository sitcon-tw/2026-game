"use client";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { api, ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { scrubTokenFromCurrentUrl } from "@/lib/authUrl";
import { useUserStore } from "@/stores/userStore";
import type { User } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * AuthGuard — 保護 (player) 路由群組。
 * 1. 直接用 server-set cookie 驗證 session
 * 2. 未登入或 session 失效時跳轉 /login
 * 3. 驗證通過後才 render children（Header / Page / BottomNav）
 */

export default function AuthGuard({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const clearUser = useUserStore(s => s.clearUser);
	const setUser = useUserStore(s => s.setUser);

	// Build login URL, preserving token param if present
	const loginUrl = (() => {
		const token = searchParams.get("token");
		return token ? `/login?token=${encodeURIComponent(token)}` : "/login";
	})();

	const { data, isLoading, isError, error } = useQuery({
		queryKey: queryKeys.user.me,
		queryFn: () => api.get<User>("/users/me"),
		retry: false // Never retry auth checks
	});

	// Sync user data to store on success
	useEffect(() => {
		if (data) setUser(data);
	}, [data, setUser]);

	// Redirect on auth failure
	useEffect(() => {
		if (isError && error instanceof ApiError && error.status === 401) {
			clearUser();
			scrubTokenFromCurrentUrl();
			router.replace(loginUrl);
		}
	}, [isError, error, clearUser, router, loginUrl]);

	if (isLoading) {
		return <LoadingSpinner fullPage />;
	}

	// 401 → redirect in progress
	if (isError && error instanceof ApiError && error.status === 401) return null;

	return <>{children}</>;
}
