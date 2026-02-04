package config

import (
	"sync"

	"github.com/caarlos0/env/v10"
	_ "github.com/joho/godotenv/autoload"
)

// AppEnv represents the running environment.
type AppEnv string

// AppEnv values.
const (
	AppEnvDev  AppEnv = "dev"
	AppEnvProd AppEnv = "prod"
)

// EnvConfig holds all environment variables for the application
type EnvConfig struct {
	AppEnv       AppEnv `env:"APP_ENV" envDefault:"dev"`
	AppName      string `env:"APP_NAME" envDefault:"2026-game"`
	AppMachineID int16  `env:"APP_MACHINE_ID" envDefault:"1"`
	AppPort      string `env:"APP_PORT" envDefault:"8000"`

	// PostgreSQL Settings
	DBHost     string `env:"DB_HOST" envDefault:"localhost"`
	DBPort     string `env:"DB_PORT" envDefault:"5432"`
	DBUser     string `env:"DB_USER" envDefault:"2026-game"`
	DBPassword string `env:"DB_PASSWORD" envDefault:"2026-game-password"`
	DBName     string `env:"DB_NAME" envDefault:"2026-game"`
	DBSSLMode  string `env:"DB_SSL_MODE" envDefault:"disable"`
	
	// Other
	OPassURL string `env:"OPASS_URL" envDefault:"https://ccip.opass.app/"`
}

var (
	appConfig *EnvConfig
	once      sync.Once
)

// load loads and validates all environment variables
func load() (*EnvConfig, error) {
	cfg := &EnvConfig{}
	if err := env.Parse(cfg); err != nil {
		return nil, err
	}
	return cfg, nil
}

// Init initializes the config only once
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
		panic("config not initialized — call InitConfig() first")
	}
	return appConfig
}
