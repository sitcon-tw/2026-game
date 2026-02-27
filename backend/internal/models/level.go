package models

// Level represents a single row in the configured level CSV.
// It is not persisted in the database; used for runtime gameplay config.
type Level struct {
	StartLevel int `json:"start_level"`
	EndLevel   int `json:"end_level"`
	Speed      int `json:"speed"`
	Notes      int `json:"notes"`
}

// LevelInfo is the computed runtime payload for a single level.
type LevelInfo struct {
	Level int      `json:"level"`
	Speed int      `json:"speed"`
	Notes int      `json:"notes"`
	Sheet []string `json:"sheet"`
}

// SheetMusic holds the ordered list of note names for gameplay.
// Notes map directly to the lines in the configured sheet music CSV.
type SheetMusic struct {
	Notes []string `json:"notes"`
}
