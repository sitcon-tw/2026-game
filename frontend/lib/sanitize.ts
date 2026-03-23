import type { DiscountCoupon, User } from "@/types/api";
import type { ClientDiscountCoupon, ClientUser } from "@/types/client";

export function sanitizeUser(raw: User): ClientUser {
	return {
		id: raw.id,
		nickname: raw.nickname,
		avatar: raw.avatar ?? null,
		current_level: raw.current_level,
		unlock_level: raw.unlock_level,
		group: raw.group ?? null,
		namecard_bio: raw.namecard_bio ?? null,
		namecard_email: raw.namecard_email ?? null,
		namecard_links: raw.namecard_links ?? [],
		coupon_token: raw.coupon_token
	};
}
