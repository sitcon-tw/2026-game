import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { Announcement } from "@/types/api";

/** GET /announcements — 取得公告列表（公開，不需登入） */
export function useAnnouncements() {
  return useQuery({
    queryKey: queryKeys.announcements.list,
    queryFn: () => api.get<Announcement[]>("/announcements"),
  });
}
