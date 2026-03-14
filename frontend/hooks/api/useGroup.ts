import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { GroupMember } from "@/types/api";

/** GET /group/members — 取得指南針計畫夥伴與簽到狀態 */
export function useGroupMembers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.group.members,
    queryFn: () => api.get<GroupMember[]>("/group/members"),
    enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });
}

/** POST /group/check-ins — 掃描夥伴一次性 QR 完成指南針簽到 */
export function useGroupCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userQRCode: string) =>
      api.post<void>("/group/check-ins", { user_qr_code: userQRCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.group.members });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
    },
  });
}
