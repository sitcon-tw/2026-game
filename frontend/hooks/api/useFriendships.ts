import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { FriendCountResponse } from "@/types/api";

/** GET /friendships/stats — 取得好友數量及上限 */
export function useFriendCount() {
  return useQuery({
    queryKey: queryKeys.friendships.count,
    queryFn: () => api.get<FriendCountResponse>("/friendships/stats"),
  });
}

/** POST /friendships — 掃描好友 QR code 建立好友關係 */
export function useAddFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userQRCode: string) =>
      api.post<string>("/friendships", { user_qr_code: userQRCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friendships.list });
      queryClient.invalidateQueries({ queryKey: queryKeys.friendships.count });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
    },
  });
}
