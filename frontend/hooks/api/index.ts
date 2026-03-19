// Player
export { useActivityStats, useBoothCheckin, useBoothLogin, useBoothStats, useCheckinActivity } from "@/hooks/api/useActivities";
export { useAnnouncements } from "@/hooks/api/useAnnouncements";
export {
	useCouponDefinitions,
	useCoupons,
	useRedeemGiftCoupon,
	useStaffAssignCouponByQRCode,
	useStaffLogin,
	useStaffLookupCoupons,
	useStaffRedeemCoupon,
	useStaffRedemptionHistory,
	useStaffScanAssignmentHistory
} from "@/hooks/api/useCoupons";
export { useAddFriend, useFriendCount, useFriendList } from "@/hooks/api/useFriendships";
export { useLeaderboard, useLevelInfo, useSubmitLevel } from "@/hooks/api/useGames";
export { useGroupCheckIn, useGroupMembers } from "@/hooks/api/useGroup";
export { useCurrentUser, useLoginWithToken, useOneTimeQR, useUpdateNamecard } from "@/hooks/api/useUser";

// Admin
export { useAdminAssignCoupon, useAdminCreateGiftCoupon, useAdminDeleteGiftCoupon, useAdminGiftCoupons, useAdminLogin, useAdminSearchUsers } from "@/hooks/api/useAdmin";
