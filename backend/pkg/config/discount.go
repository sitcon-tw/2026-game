package config

// DiscountRule defines a discount rule for coupons.
type DiscountRule struct {
	ID          string
	PassLevel   int
	Amount      int
	Description string
}

const (
	DiscountIDCheckInAllBoothAndCheck = "check-in-all-booth-and-check"
	DiscountIDTourGroupChallenge      = "tour-group-challenge"
	DiscountIDSitconSNSCoupon         = "sitcon-sns-coupon"
	DiscountIDLeaderboardTopTen       = "leaderboard-top-10"

	// TourGroupChallengeActivityName is the official name for the tour-group challenge activity.
	TourGroupChallengeActivityName = "導遊團"

	// SitconSNSCouponPrice is the fixed price for the limited-time social story check-in coupon.
	SitconSNSCouponPrice = 35
)

//nolint:mnd // config-style rule table
func couponRules() []DiscountRule {
	return []DiscountRule{
		{
			ID:          DiscountIDCheckInAllBoothAndCheck,
			PassLevel:   0,
			Amount:      25,
			Description: "解鎖 23 個攤位和打卡點",
		},
		{
			ID:          DiscountIDTourGroupChallenge,
			PassLevel:   0,
			Amount:      35,
			Description: "導遊團",
		},
		{ID: "level-50", PassLevel: 50, Amount: 25, Description: "完成 50 關"},
		{
			ID:          DiscountIDSitconSNSCoupon,
			PassLevel:   0,
			Amount:      SitconSNSCouponPrice,
			Description: "限時動態或貼文分享",
		},
		{
			ID:          DiscountIDLeaderboardTopTen,
			PassLevel:   0,
			Amount:      50,
			Description: "排行榜前 10 名（16:00 結算）",
		},
	}
}

// GetCouponRules returns all configured coupon rules.
func GetCouponRules() []DiscountRule {
	return couponRules()
}

// GetCouponRulesByLevel returns all discount rules applicable for the given level.
func GetCouponRulesByLevel(level int) []DiscountRule {
	res := []DiscountRule{}

	for _, rule := range couponRules() {
		if rule.PassLevel > 0 && rule.PassLevel <= level {
			res = append(res, rule)
		}
	}

	return res
}

// GetCheckInCompletionCouponRule returns the check-in completion coupon rule.
func GetCheckInCompletionCouponRule() (DiscountRule, bool) {
	for _, rule := range couponRules() {
		if rule.ID == DiscountIDCheckInAllBoothAndCheck {
			return rule, true
		}
	}

	return DiscountRule{}, false
}

// GetTourGroupChallengeCouponRule returns the tour-group challenge coupon rule.
func GetTourGroupChallengeCouponRule() (DiscountRule, bool) {
	for _, rule := range couponRules() {
		if rule.ID == DiscountIDTourGroupChallenge {
			return rule, true
		}
	}

	return DiscountRule{}, false
}

// GetLeaderboardTopTenCouponRule returns the leaderboard top-ten coupon rule.
func GetLeaderboardTopTenCouponRule() (DiscountRule, bool) {
	for _, rule := range couponRules() {
		if rule.ID == DiscountIDLeaderboardTopTen {
			return rule, true
		}
	}

	return DiscountRule{}, false
}
