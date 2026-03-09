package config

// DiscountRule defines a discount rule for coupons.
type DiscountRule struct {
	ID          string
	PassLevel   int
	Amount      int
	MaxQty      int
	Description string
}

const (
	DiscountIDCheckInAllBoothAndCheck = "check-in-all-booth-and-check"
	DiscountIDTourGroupChallenge      = "tour-group-challenge"

	// Real activity ID for tour-group challenge activity.
	TourGroupChallengeActivityID = "8f1a4209-c8fc-4e21-94a2-38eaad028110"
)

//nolint:mnd // config-style rule table
func couponRules() []DiscountRule {
	return []DiscountRule{
		{
			ID:          DiscountIDCheckInAllBoothAndCheck,
			PassLevel:   0,
			Amount:      50,
			MaxQty:      999999999,
			Description: "打卡完所有攤位和活動場地（不含闖關）",
		},
		{
			ID:          DiscountIDTourGroupChallenge,
			PassLevel:   0,
			Amount:      1,
			MaxQty:      999999999,
			Description: "導遊團闖關",
		},
		{ID: "level-50", PassLevel: 50, Amount: 200, MaxQty: 999999999, Description: "完成 50 關"},
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
