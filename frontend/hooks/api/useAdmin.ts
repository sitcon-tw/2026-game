import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type {
  AdminLoginResponse,
  DiscountCouponGift,
  DiscountCoupon,
  User,
} from "@/types/api";

/* ── Session ── */

/** POST /admin/session — 管理員登入（Bearer token） */
export function useAdminLogin() {
  return useMutation({
    mutationFn: (adminKey: string) =>
      api.post<AdminLoginResponse>("/admin/session", undefined, {
        Authorization: `Bearer ${adminKey}`,
      }),
  });
}

/* ── Gift Coupons ── */

/** GET /admin/gift-coupons — 列出所有 gift coupons */
export function useAdminGiftCoupons() {
  return useQuery({
    queryKey: queryKeys.admin.giftCoupons,
    queryFn: () => api.get<DiscountCouponGift[]>("/admin/gift-coupons"),
  });
}

/** POST /admin/gift-coupons — 建立 gift coupon */
export function useAdminCreateGiftCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { discount_id: string; price: number }) =>
      api.post<DiscountCouponGift>("/admin/gift-coupons", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.giftCoupons,
      });
    },
  });
}

/** DELETE /admin/gift-coupons/{id} — 刪除 gift coupon */
export function useAdminDeleteGiftCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/admin/gift-coupons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.giftCoupons,
      });
    },
  });
}

/* ── User Search ── */

/** GET /admin/users?q={keyword}&limit={n} — 搜尋使用者 */
export function useAdminSearchUsers(q: string, limit = 20) {
  return useQuery({
    queryKey: queryKeys.admin.users(q),
    queryFn: () => api.get<User[]>(`/admin/users?q=${encodeURIComponent(q)}&limit=${limit}`),
    enabled: q.length > 0,
  });
}

/* ── Assign Coupon ── */

/** POST /admin/discount-coupons/assignments — 指派折價券給使用者 */
export function useAdminAssignCoupon() {
  return useMutation({
    mutationFn: (payload: {
      user_id: string;
      discount_id: string;
      price: number;
    }) => api.post<DiscountCoupon>("/admin/discount-coupons/assignments", payload),
  });
}
