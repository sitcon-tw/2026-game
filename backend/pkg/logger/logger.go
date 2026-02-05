package logger

import (
	"github.com/sitcon-tw/2026-game/pkg/config"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// New creates a new zap.Logger based on the application environment.
func New() *zap.Logger {
	cfg := config.Env()
	var (
		logger *zap.Logger
		err    error
	)

	if cfg.AppEnv == config.AppEnvDev {
		devConfig := zap.NewDevelopmentConfig()
		devConfig.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
		logger, err = devConfig.Build()
	} else {
		logger, err = zap.NewProduction()
	}

	if err != nil {
		panic(err)
	}
	return logger
}
