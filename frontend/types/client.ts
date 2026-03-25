/** Sanitized User for client components — stripped of qrcode_token, last_pass_time, timestamps */
export interface ClientUser {
	id: string;
	nickname: string;
	avatar: string | null;
	current_level: number;
	unlock_level: number;
	group: string | null;
	namecard_bio: string | null;
	namecard_email: string | null;
	namecard_links: string[];
	coupon_token: string;
}

/** Sanitized DiscountCoupon for client — stripped of user_id, used_by, history_id, created_at */
export interface ClientDiscountCoupon {
	id: string;
	discount_id: string;
	price: number;
	used_at: string | null;
}
