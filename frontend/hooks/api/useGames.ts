import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { RankResponse, SubmitResponse, LevelInfoResponse } from "@/types/api";

/** GET /games/levels/{level} — 取得指定關卡資訊 */
export function useLevelInfo(level: number | "current") {
  return useQuery({
    queryKey: queryKeys.games.levelInfo(level),
    queryFn: () => api.get<LevelInfoResponse>(`/games/levels/${level}`),
  });
}

/** GET /games/leaderboards?page= — 取得排行榜 */
export function useLeaderboard(page = 1) {
  return useQuery({
    queryKey: queryKeys.games.leaderboard(page),
    queryFn: () => api.get<RankResponse>(`/games/leaderboards?page=${page}`),
  });
}

/** POST /games/submissions — 提交通關紀錄 */
export function useSubmitLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<SubmitResponse>("/games/submissions"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
  });
}
