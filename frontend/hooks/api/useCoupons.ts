import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  DiscountCoupon,
  GetUserCouponsResponse,
  DiscountUsedResponse,
  DiscountHistoryItem,
  Staff,
} from "@/types/api";
import { queryKeys } from "@/lib/queryKeys";

/* ── Player ── */

/** GET /discount-coupons — 取得自己的折扣券 */
export function useCoupons() {
  return useQuery({
    queryKey: queryKeys.coupons.list,
    queryFn: () => api.get<DiscountCoupon[]>("/discount-coupons"),
  });
}

/* ── Staff ── */

/** POST /discount-coupons/staff/session — 工作人員登入 */
export function useStaffLogin() {
  return useMutation({
    mutationFn: (token: string) =>
      api.post<Staff>("/discount-coupons/staff/session", undefined, {
        Authorization: `Bearer ${token}`,
      }),
  });
}

/** POST /discount-coupons/staff/coupon-tokens/query — 查詢某使用者可用折扣券 */
export function useStaffLookupCoupons() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userCouponToken: string) =>
      api.post<GetUserCouponsResponse>(
        "/discount-coupons/staff/coupon-tokens/query",
        { user_coupon_token: userCouponToken }
      ),
  });
}

/** POST /discount-coupons/staff/redemptions — 使用折扣券 */
export function useStaffRedeemCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userCouponToken: string) =>
      api.post<DiscountUsedResponse>(
        "/discount-coupons/staff/redemptions",
        { user_coupon_token: userCouponToken }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["coupons", "staff", "lookup"],
      });
      queryClient.invalidateQueries({
        queryKey: ["coupons", "staff", "history"],
      });
    },
  });
}

/** GET /discount-coupons/staff/current/redemptions — 工作人員折扣紀錄 */
export function useStaffRedemptionHistory() {
  return useQuery({
    queryKey: ["coupons", "staff", "history"] as const,
    queryFn: () =>
      api.get<DiscountHistoryItem[]>(
        "/discount-coupons/staff/current/redemptions"
      ),
  });
}
