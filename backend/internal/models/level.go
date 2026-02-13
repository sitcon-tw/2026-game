package models

// Level represents a single row in data/level.csv.
// It is not persisted in the database; used for runtime gameplay config.
type Level struct {
	Level int `json:"level"`
	Speed int `json:"speed"`
	Notes int `json:"notes"`
}

// SheetMusic holds the ordered list of note names for gameplay.
// Notes map directly to the lines in data/sheet_music.csv.
type SheetMusic struct {
	Notes []string `json:"notes"`
}
