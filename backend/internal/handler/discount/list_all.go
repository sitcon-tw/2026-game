package discount

import (
	"encoding/json"
	"net/http"

	"github.com/sitcon-tw/2026-game/pkg/config"
	"github.com/sitcon-tw/2026-game/pkg/res"
)

type couponRuleWithStatus struct {
	ID          string `json:"id"`
	PassLevel   int    `json:"pass_level"`
	Amount      int    `json:"amount"`
	IssuedQty   int    `json:"issued_qty"`
	Description string `json:"description"`
}

// ListAllCoupons handles GET /discount-coupons/coupons.
// @Summary      取得所有折扣券規則與發放狀態
// @Description  公開回傳所有折扣券規則與目前發放數量。
// @Tags         discount
// @Produce      json
// @Success      200  {array}   couponRuleWithStatus
// @Failure      500  {object}  res.ErrorResponse
// @Router       /discount-coupons/coupons [get]
func (h *Handler) ListAllCoupons(w http.ResponseWriter, r *http.Request) {
	rules := config.GetCouponRules()
	discountIDs := make([]string, 0, len(rules))
	for _, rule := range rules {
		discountIDs = append(discountIDs, rule.ID)
	}

	tx, err := h.Repo.StartTransaction(r.Context())
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to start transaction")
		return
	}
	defer h.Repo.DeferRollback(r.Context(), tx)

	counts, err := h.Repo.CountDiscountCouponsByDiscountIDs(r.Context(), tx, discountIDs)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to count issued coupons")
		return
	}

	err = h.Repo.CommitTransaction(r.Context(), tx)
	if err != nil {
		res.Fail(w, r, http.StatusInternalServerError, err, "failed to commit transaction")
		return
	}

	resp := make([]couponRuleWithStatus, 0, len(rules))
	for _, rule := range rules {
		issuedQty := counts[rule.ID]
		resp = append(resp, couponRuleWithStatus{
			ID:          rule.ID,
			PassLevel:   rule.PassLevel,
			Amount:      rule.Amount,
			IssuedQty:   issuedQty,
			Description: rule.Description,
		})
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}
