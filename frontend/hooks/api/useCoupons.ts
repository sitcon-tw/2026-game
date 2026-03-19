import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { CouponDefinition, DiscountCoupon, DiscountHistoryItem, DiscountUsedResponse, GetUserCouponsResponse, Staff, StaffScanAssignmentItem } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/* ── Player ── */

/** GET /discount-coupons — 取得自己的折扣券 */
export function useCoupons() {
	return useQuery({
		queryKey: queryKeys.coupons.list,
		queryFn: () => api.get<DiscountCoupon[]>("/discount-coupons")
	});
}

/** POST /discount-coupons/gifts — 透過 gift token 兌換折扣券 */
export function useRedeemGiftCoupon() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (token: string) => api.post<DiscountCoupon>("/discount-coupons/gifts", { token }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.coupons.list });
		}
	});
}

/** GET /discount-coupons/coupons — 取得所有折價券定義 */
export function useCouponDefinitions() {
	return useQuery({
		queryKey: queryKeys.coupons.definitions,
		queryFn: () => api.get<CouponDefinition[]>("/discount-coupons/coupons")
	});
}

/* ── Staff ── */

/** POST /discount-coupons/staff/session — 工作人員登入 */
export function useStaffLogin() {
	return useMutation({
		mutationFn: (token: string) =>
			api.post<Staff>("/discount-coupons/staff/session", undefined, {
				Authorization: `Bearer ${token}`
			})
	});
}

/** POST /discount-coupons/staff/coupon-tokens/query — 查詢某使用者可用折扣券 */
export function useStaffLookupCoupons() {
	return useMutation({
		mutationFn: (userCouponToken: string) => api.post<GetUserCouponsResponse>("/discount-coupons/staff/coupon-tokens/query", { user_coupon_token: userCouponToken })
	});
}

/** POST /discount-coupons/staff/redemptions — 使用折扣券 */
export function useStaffRedeemCoupon() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (userCouponToken: string) =>
			api.post<DiscountUsedResponse>("/discount-coupons/staff/redemptions", {
				user_coupon_token: userCouponToken
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.staff.lookup
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.staff.history
			});
		}
	});
}

/** GET /discount-coupons/staff/current/redemptions — 工作人員折扣紀錄 */
export function useStaffRedemptionHistory() {
	return useQuery({
		queryKey: queryKeys.staff.history,
		queryFn: () => api.get<DiscountHistoryItem[]>("/discount-coupons/staff/current/redemptions")
	});
}

/** POST /discount-coupons/staff/scan-assignments — 掃碼發放固定折價券 */
export function useStaffAssignCouponByQRCode() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (userQRCode: string) =>
			api.post<DiscountCoupon>("/discount-coupons/staff/scan-assignments", {
				user_qr_code: userQRCode
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.staff.scanHistory
			});
		}
	});
}

/** GET /discount-coupons/staff/current/scan-assignments — 工作人員掃碼發券紀錄 */
export function useStaffScanAssignmentHistory() {
	return useQuery({
		queryKey: queryKeys.staff.scanHistory,
		queryFn: () => api.get<StaffScanAssignmentItem[]>("/discount-coupons/staff/current/scan-assignments")
	});
}
