/* ── Users ── */

export interface User {
  id: string;
  nickname: string;
  current_level: number;
  unlock_level: number;
  qrcode_token: string;
  coupon_token: string;
  last_pass_time: string;
  created_at: string;
  updated_at: string;
}

/* ── Activities ── */

export interface ActivityWithStatus {
  id: string;
  name: string;
  type: string; // "booth" | "checkin" | "challenge"
  visited: boolean;
}

export interface CheckinResponse {
  status: string;
}

export interface ActivityCountResponse {
  count: number;
}

export interface BoothActivity {
  id: string;
  name: string;
  description: string;
  link: string;
  type: string;
  qrcode_token: string;
  created_at: string;
  updated_at: string;
}

/* ── Games ── */

export interface RankEntry {
  nickname: string;
  level: number;
  rank: number;
}

export interface RankResponse {
  rank: RankEntry[];
  around: RankEntry[];
  me: RankEntry | null;
  page: number;
}

export interface CouponReward {
  id: string;
  price: number;
  discount_id: string;
}

export interface SubmitResponse {
  current_level: number;
  unlock_level: number;
  coupons: CouponReward[];
}

export interface LevelInfoResponse {
  level: number;
  notes: number;
  sheet: string[];
  speed: number;
}

/* ── Friendships ── */

export interface FriendCountResponse {
  count: number;
  max: number;
}

/* ── Coupon Definitions (from staff API) ── */

export interface CouponDefinition {
  id: string;
  pass_level: number;
  amount: number;
  max_qty: number;
  issued_qty: number;
  description: string;
  is_max_qty_reached: boolean;
}

/* ── Discount Coupons ── */

export interface DiscountCoupon {
  id: string;
  discount_id: string;
  price: number;
  user_id: string;
  used_at: string | null;
  used_by: string | null;
  history_id: string | null;
  created_at: string;
}

export interface GetUserCouponsResponse {
  coupons: DiscountCoupon[];
  total: number;
}

export interface DiscountUsedResponse {
  user_id: string;
  user_name: string;
  coupons: DiscountCoupon[];
  total: number;
  count: number;
  coupon_token: string;
  used_at: string;
  used_by: string;
}

export interface DiscountHistoryItem {
  id: string;
  user_id: string;
  nickname: string;
  staff_id: string;
  total: number;
  used_at: string;
}

/* ── Staff ── */

export interface Staff {
  id: string;
  name: string;
  token: string;
  created_at: string;
  updated_at: string;
}

/* ── Common ── */

export interface ErrorResponse {
  message: string;
}

/* ── Request Types ── */

export interface ActivityCheckInRequest {
  activity_qr_code: string;
}

export interface BoothCheckInRequest {
  user_qr_code: string;
}

export interface AddFriendRequest {
  user_qr_code: string;
}

export interface GetUserCouponsRequest {
  user_coupon_token: string;
}

export interface DiscountUsedRequest {
  user_coupon_token: string;
}
