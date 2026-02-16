"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "@/stores/userStore";
import { api, ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { User } from "@/types/api";

/**
 * AuthGuard — 保護 (player) 路由群組。
 * 1. 等待 Zustand persist 從 localStorage rehydrate 完成
 * 2. 檢查 authToken 是否存在；無 token → 跳轉 /login
 * 3. 有 token 時才發 GET /users/me 驗證 session；401 → 跳轉 /login
 * 4. 驗證通過後才 render children（Header / Page / BottomNav）
 */

/** Subscribe to Zustand persist hydration state (SSR-safe) */
function useStoreHydrated() {
    return useSyncExternalStore(
        (cb) => useUserStore.persist.onFinishHydration(cb),
        () => useUserStore.persist.hasHydrated(),
        () => false, // SSR always returns false
    );
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const storeHydrated = useStoreHydrated();
    const authToken = useUserStore((s) => s.authToken);
    const clearUser = useUserStore((s) => s.clearUser);
    const setUser = useUserStore((s) => s.setUser);

    // Only fire the session check when we have a token AND store is hydrated
    const shouldCheck = storeHydrated && !!authToken;

    const { data, isLoading, isError, error } = useQuery({
        queryKey: queryKeys.user.me,
        queryFn: () => api.get<User>("/users/me"),
        enabled: shouldCheck,
        retry: false, // Never retry auth checks
    });

    // Sync user data to store on success
    useEffect(() => {
        if (data) setUser(data);
    }, [data, setUser]);

    // Redirect on auth failure
    useEffect(() => {
        if (!storeHydrated) return;

        if (!authToken) {
            clearUser();
            router.replace("/login");
            return;
        }

        if (isError && error instanceof ApiError && error.status === 401) {
            clearUser();
            router.replace("/login");
        }
    }, [storeHydrated, authToken, isError, error, clearUser, router]);

    // Store not yet rehydrated or session check in flight
    if (!storeHydrated || (shouldCheck && isLoading)) {
        return <LoadingSpinner fullPage />;
    }

    // No token → redirect in progress
    if (!authToken) return null;

    // 401 → redirect in progress
    if (isError && error instanceof ApiError && error.status === 401) return null;

    return <>{children}</>;
}
