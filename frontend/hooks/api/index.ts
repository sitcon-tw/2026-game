// Player
export {
  useCurrentUser,
  useLoginWithToken,
  useOneTimeQR,
  useUpdateNamecard,
} from "@/hooks/api/useUser";
export {
  useActivityStats,
  useCheckinActivity,
  useBoothStats,
  useBoothLogin,
  useBoothCheckin,
} from "@/hooks/api/useActivities";
export {
  useLeaderboard,
  useLevelInfo,
  useSubmitLevel,
} from "@/hooks/api/useGames";
export { useFriendCount, useAddFriend, useFriendList } from "@/hooks/api/useFriendships";
export { useGroupMembers, useGroupCheckIn } from "@/hooks/api/useGroup";
export { useAnnouncements } from "@/hooks/api/useAnnouncements";
export {
  useCoupons,
  useCouponDefinitions,
  useRedeemGiftCoupon,
  useStaffLogin,
  useStaffLookupCoupons,
  useStaffRedeemCoupon,
  useStaffRedemptionHistory,
  useStaffAssignCouponByQRCode,
  useStaffScanAssignmentHistory,
} from "@/hooks/api/useCoupons";

// Admin
export {
  useAdminLogin,
  useAdminGiftCoupons,
  useAdminCreateGiftCoupon,
  useAdminDeleteGiftCoupon,
  useAdminSearchUsers,
  useAdminAssignCoupon,
} from "@/hooks/api/useAdmin";
