package game

// RankEntry is the public representation of a leaderboard row.
type RankEntry struct {
	Nickname string `json:"nickname"`
	Level    int    `json:"level"`
	Rank     int    `json:"rank"`
}

// RankResponse is returned by GET /game/rank.
// Top10 contains the global top 10 users; Around contains the caller's ±5 neighbors (inclusive); Me is the caller.
type RankResponse struct {
	Top10  []RankEntry `json:"top10"`
	Around []RankEntry `json:"around"`
	Me     *RankEntry  `json:"me"`
}

// SubmitResponse is returned by POST /game.
type SubmitResponse struct {
	CurrentLevel int `json:"current_level"`
	UnlockLevel  int `json:"unlock_level"`
}
