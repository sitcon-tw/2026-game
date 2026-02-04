package game

// RankEntry is the public representation of a leaderboard row.
type RankEntry struct {
	Nickname string `json:"nickname"`
	Level    int    `json:"level"`
	Rank     int    `json:"rank"`
}

// RankResponse is returned by GET /game/rank.
// Rank contains the global ranking list (paged); Around contains the caller's ±5 neighbors (inclusive);
// Me is the caller; Page echoes the requested page number for Rank.
type RankResponse struct {
	Rank   []RankEntry `json:"rank"`
	Around []RankEntry `json:"around"`
	Me     *RankEntry  `json:"me"`
	Page   int         `json:"page"`
}

// SubmitResponse is returned by POST /game.
type SubmitResponse struct {
	CurrentLevel int `json:"current_level"`
	UnlockLevel  int `json:"unlock_level"`
}
