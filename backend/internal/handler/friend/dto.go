package friend

// CountResponse is returned by GET /friends/count.
type CountResponse struct {
	Count int `json:"count"`
	Max   int `json:"max"`
}
