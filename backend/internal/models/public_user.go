package models

// PublicNamecard is the user namecard data shown to other users.
type PublicNamecard struct {
	Bio   *string  `json:"bio,omitempty"`
	Links []string `json:"links,omitempty"`
	Email *string  `json:"email,omitempty"`
}

// PublicUser is the shared public user representation across APIs.
type PublicUser struct {
	ID           string         `json:"id"`
	Nickname     string         `json:"nickname"`
	Avatar       *string        `json:"avatar,omitempty"`
	CurrentLevel int            `json:"current_level"`
	Namecard     PublicNamecard `json:"namecard"`
}

// ToPublicUser converts a full user row to the shared public shape.
func ToPublicUser(user User) PublicUser {
	links := make([]string, len(user.NamecardLinks))
	copy(links, user.NamecardLinks)

	return PublicUser{
		ID:           user.ID,
		Nickname:     user.Nickname,
		Avatar:       user.Avatar,
		CurrentLevel: user.CurrentLevel,
		Namecard: PublicNamecard{
			Bio:   user.NamecardBio,
			Links: links,
			Email: user.NamecardEmail,
		},
	}
}
