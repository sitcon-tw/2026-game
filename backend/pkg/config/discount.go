package config

type CouponRule struct {
	PassLevel int
	Amount    int
	MaxQty    int
}

var couponRules = []CouponRule{
	{PassLevel: 5, Amount: 50, MaxQty: 1},
	{PassLevel: 10, Amount: 100, MaxQty: 1},
	{PassLevel: 20, Amount: 200, MaxQty: 1},
	{PassLevel: 40, Amount: 300, MaxQty: 1},
}

func GetCouponRulesByLevel(level int) []CouponRule {
	res := []CouponRule{}

	for _, rule := range couponRules {
		if rule.PassLevel <= level {
			res = append(res, rule)
		}
	}

	return res
}

func GetCouponRuleByAmount(amount int) (CouponRule, bool) {
	for _, rule := range couponRules {
		if rule.Amount == amount {
			return rule, true
		}
	}
	return CouponRule{}, false
}
