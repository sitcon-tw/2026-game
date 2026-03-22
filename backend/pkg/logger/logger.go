package logger

import (
	"os"

	"github.com/sitcon-tw/2026-game/pkg/config"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// New creates a new zap.Logger based on the application environment.
func New() *zap.Logger {
	cfg := config.Env()
	var zapConfig zap.Config
	if cfg.AppEnv == config.AppEnvDev {
		zapConfig = zap.NewDevelopmentConfig()
		zapConfig.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	} else {
		zapConfig = zap.NewProductionConfig()
	}

	stdoutCore := zapcore.NewCore(
		newEncoder(zapConfig),
		zapcore.Lock(os.Stdout),
		zapConfig.Level,
	)

	core := stdoutCore
	if cfg.LokiEnabled && cfg.LokiURL != "" {
		lokiCore := zapcore.NewCore(
			zapcore.NewJSONEncoder(zap.NewProductionEncoderConfig()),
			newLokiWriteSyncer(cfg),
			zapConfig.Level,
		)
		core = zapcore.NewTee(stdoutCore, lokiCore)
	}

	logger := zap.New(core, zap.AddCaller(), zap.AddStacktrace(zap.ErrorLevel))
	if cfg.AppEnv == config.AppEnvDev {
		return logger.WithOptions(zap.Development())
	}

	return logger
}

func newEncoder(cfg zap.Config) zapcore.Encoder {
	if cfg.Encoding == "console" {
		return zapcore.NewConsoleEncoder(cfg.EncoderConfig)
	}

	return zapcore.NewJSONEncoder(cfg.EncoderConfig)
}
