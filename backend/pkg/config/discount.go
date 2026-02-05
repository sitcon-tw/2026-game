package config

type DiscountRule struct {
	ID        string
	PassLevel int
	Amount    int
	MaxQty    int
}

var couponRules = []DiscountRule{
	{ID: "level-5", PassLevel: 5, Amount: 50, MaxQty: 1},
	{ID: "level-10", PassLevel: 10, Amount: 100, MaxQty: 1},
	{ID: "level-20", PassLevel: 20, Amount: 200, MaxQty: 1},
	{ID: "level-40", PassLevel: 40, Amount: 300, MaxQty: 1},
}

func GetCouponRulesByLevel(level int) []DiscountRule {
	res := []DiscountRule{}

	for _, rule := range couponRules {
		if rule.PassLevel <= level {
			res = append(res, rule)
		}
	}

	return res
}

func GetCouponRuleByAmount(amount int) (DiscountRule, bool) {
	for _, rule := range couponRules {
		if rule.Amount == amount {
			return rule, true
		}
	}
	return DiscountRule{}, false
}
