import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type {
  ActivityWithStatus,
  CheckinResponse,
  ActivityCountResponse,
  BoothActivity,
} from "@/types/api";

/** GET /activities/stats — 取得活動列表及使用者打卡狀態 */
export function useActivityStats() {
  return useQuery({
    queryKey: queryKeys.activities.stats,
    queryFn: () => api.get<ActivityWithStatus[]>("/activities/stats"),
  });
}

/** POST /activities/check-ins — 使用者掃描活動 QR code 打卡 */
export function useCheckinActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityQRCode: string) =>
      api.post<CheckinResponse>("/activities/check-ins", {
        activity_qr_code: activityQRCode,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
    },
  });
}

/** GET /activities/booth/stats — 取得攤位打卡人數 */
export function useBoothStats() {
  return useQuery({
    queryKey: queryKeys.activities.boothStats,
    queryFn: () => api.get<ActivityCountResponse>("/activities/booth/stats"),
  });
}

/** POST /activities/booth/session — 攤位登入（帶 Authorization header） */
export function useBoothLogin() {
  return useMutation({
    mutationFn: (token: string) =>
      api.post<BoothActivity>("/activities/booth/session", undefined, {
        Authorization: `Bearer ${token}`,
      }),
  });
}

/** POST /activities/booth/user/check-ins — 攤位掃描使用者 QR code 打卡 */
export function useBoothCheckin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userQRCode: string) =>
      api.post<CheckinResponse>("/activities/booth/user/check-ins", {
        user_qr_code: userQRCode,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.activities.boothStats,
      });
    },
  });
}
