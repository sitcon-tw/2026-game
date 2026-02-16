"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useUserStore } from "@/stores/userStore";
import type { User } from "@/types/api";

/** GET /users/me — 取得目前登入使用者的資料
 *  只在有 authToken 時才發送請求，避免未登入時產生 401。
 */
export function useCurrentUser() {
  const setUser = useUserStore((state) => state.setUser);
  const authToken = useUserStore((state) => state.authToken);

  const query = useQuery({
    queryKey: queryKeys.user.me,
    queryFn: () => api.get<User>("/users/me"),
    enabled: !!authToken,
  });

  // Update store when data changes
  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  return query;
}

/** POST /users/session — 使用 OPass token 登入，設定 cookie */
export function useLoginWithToken() {
  const queryClient = useQueryClient();
  const setUser = useUserStore((state) => state.setUser);
  const setAuthToken = useUserStore((state) => state.setAuthToken);

  return useMutation({
    mutationFn: async (token: string) => {
      // Login uses Authorization header; cookie is set after success
      const user = await api.post<User>("/users/session", undefined, {
        Authorization: `Bearer ${token}`,
      });
      return { user, token };
    },
    onSuccess: ({ user, token }) => {
      // Persist auth token to cookie + localStorage
      setAuthToken(token);
      setUser(user);
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.session });
    },
  });
}
