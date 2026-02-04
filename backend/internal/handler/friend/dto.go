package friend

// FriendCountResponse is returned by GET /friends/count.
type FriendCountResponse struct {
	Count int `json:"count"`
	Max   int `json:"max"`
}
