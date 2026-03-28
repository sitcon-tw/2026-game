"use client";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useUserStore } from "@/stores/userStore";
import type { OneTimeQRResponse, UpdateNamecardRequest, User } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

/** GET /users/me — 取得目前登入使用者的資料
	*  依賴 server-set cookie 驗證 session。
 */
export function useCurrentUser() {
	const setUser = useUserStore(state => state.setUser);

	const query = useQuery({
		queryKey: queryKeys.user.me,
		queryFn: () => api.get<User>("/users/me")
	});

	// Update store when data changes
	useEffect(() => {
		if (query.data) {
			setUser(query.data);
		}
	}, [query.data, setUser]);

	return query;
}

/** GET /users/me/one-time-qr — 取得每 20 秒輪替的一次性 QR token */
export function useOneTimeQR() {
	const query = useQuery({
		queryKey: queryKeys.user.oneTimeQr,
		queryFn: () => api.get<OneTimeQRResponse>("/users/me/one-time-qr"),
		refetchInterval: 15000,
		staleTime: 0,
		refetchOnWindowFocus: "always"
	});

	const [isExpired, setIsExpired] = useState(false);

	useEffect(() => {
		if (!query.data?.expires_at) return;
		const check = () => {
			setIsExpired(new Date() >= new Date(query.data!.expires_at));
		};
		check();
		document.addEventListener("visibilitychange", check);
		const id = setInterval(check, 1000);
		return () => {
			document.removeEventListener("visibilitychange", check);
			clearInterval(id);
		};
	}, [query.data?.expires_at]);

	return { ...query, isExpired };
}

/** POST /users/session — 使用 OPass token 登入，設定 cookie */
export function useLoginWithToken() {
	const queryClient = useQueryClient();
	const setUser = useUserStore(state => state.setUser);

	return useMutation({
		mutationFn: async (token: string) => {
			// Login uses Authorization header; cookie is set after success
			const user = await api.post<User>("/users/session", undefined, {
				Authorization: `Bearer ${token}`
			});
			return { user, token };
		},
		onSuccess: ({ user }) => {
			setUser(user);
			queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
			queryClient.invalidateQueries({ queryKey: queryKeys.user.session });
		}
	});
}

/** PATCH /users/me/namecard — 更新自己的公開名牌資料 */
export function useUpdateNamecard() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: UpdateNamecardRequest) => api.patch<void>("/users/me/namecard", payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
			queryClient.invalidateQueries({ queryKey: queryKeys.friendships.list });
			queryClient.invalidateQueries({ queryKey: queryKeys.group.members });
			queryClient.invalidateQueries({ queryKey: ["games", "leaderboard"] });
		}
	});
}
