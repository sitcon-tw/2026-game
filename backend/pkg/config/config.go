package config

import (
	"sync"
	"time"

	"github.com/caarlos0/env/v10"
	// Load environment variables from .env file on init.
	_ "github.com/joho/godotenv/autoload"
)

// AppEnv represents the running environment.
type AppEnv string

// AppEnv values.
const (
	AppEnvDev  AppEnv = "dev"
	AppEnvProd AppEnv = "prod"
)

// EnvConfig holds all environment variables for the application.
//
//nolint:golines // struct tags aligned for readability
type EnvConfig struct {
	AppEnv         AppEnv `env:"APP_ENV" envDefault:"dev"`
	AppPort        string `env:"PORT" envDefault:"8000"`
	AppAutoMigrate bool   `env:"APP_AUTO_MIGRATE" envDefault:"false"`

	// Gameplay data locations
	LevelCSVPath      string `env:"LEVEL_CSV_PATH" envDefault:"data/level.csv"`
	SheetMusicCSVPath string `env:"SHEET_MUSIC_CSV_PATH" envDefault:"data/sheet_music.csv"`

	// CORS
	CORSAllowedOrigins []string `env:"CORS_ALLOWED_ORIGINS" envSeparator:"," envDefault:"http://localhost:3000"`

	// PostgreSQL Settings
	DBHost     string `env:"DB_HOST" envDefault:"localhost"`
	DBPort     string `env:"DB_PORT" envDefault:"5432"`
	DBUser     string `env:"DB_USER" envDefault:"2026-game"`
	DBPassword string `env:"DB_PASSWORD" envDefault:"2026-game-password"`
	DBName     string `env:"DB_NAME" envDefault:"2026-game"`
	DBSSLMode  string `env:"DB_SSL_MODE" envDefault:"disable"`

	// Other
	OPassURL string `env:"OPASS_URL" envDefault:"https://ccip.opass.app/"`

	// Gameplay tuning
	FriendCapacityMultiplier int `env:"FRIEND_CAPACITY_MULTIPLIER" envDefault:"3"`

	// Rate limiting
	RateLimitRequestsPerWindow int           `env:"RATE_LIMIT_REQUESTS_PER_WINDOW" envDefault:"20"`
	RateLimitWindow            time.Duration `env:"RATE_LIMIT_WINDOW" envDefault:"5s"`
}

var (
	appConfig *EnvConfig //nolint:gochecknoglobals // cached configuration singleton
	once      sync.Once  //nolint:gochecknoglobals // guards one-time config loading
)

// load loads and validates all environment variables.
func load() (*EnvConfig, error) {
	cfg := &EnvConfig{}
	if err := env.Parse(cfg); err != nil {
		return nil, err
	}
	return cfg, nil
}

// Init initializes the config only once.
func Init() (*EnvConfig, error) {
	var err error
	once.Do(func() {
		appConfig, err = load()
	})
	return appConfig, err
}

// Env returns the config. Panics if not initialized.
func Env() *EnvConfig {
	if appConfig == nil {
		panic("config not initialized — call Init() first")
	}
	return appConfig
}
