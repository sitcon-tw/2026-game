package telemetry

import (
	"context"
	"fmt"

	"github.com/sitcon-tw/2026-game/pkg/config"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	"go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.37.0"
	"go.opentelemetry.io/otel/trace/noop"
	"go.uber.org/zap"

	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
)

const (
	maxSampleRate = 1.0
	minSampleRate = 0.0
)

type otelErrorHandler struct {
	logger *zap.Logger
}

func (h otelErrorHandler) Handle(err error) {
	if err == nil {
		return
	}

	h.logger.Error("OpenTelemetry exporter error",
		zap.Error(err),
	)
}

// Init initializes OpenTelemetry tracing and returns a shutdown callback.
func Init(ctx context.Context, logger *zap.Logger) (func(context.Context) error, error) {
	cfg := config.Env()
	if !cfg.OTelEnabled {
		otel.SetTracerProvider(noop.NewTracerProvider())
		return func(context.Context) error { return nil }, nil
	}

	sampleRate := cfg.OTelSampleRate
	if sampleRate < minSampleRate || sampleRate > maxSampleRate {
		return nil, fmt.Errorf("OTEL_SAMPLE_RATE must be between 0.0 and 1.0; got %f", sampleRate)
	}

	otel.SetErrorHandler(otelErrorHandler{logger: logger.With(
		zap.String("endpoint", cfg.OTelEndpoint),
	)})

	exporterOptions := []otlptracegrpc.Option{
		otlptracegrpc.WithEndpoint(cfg.OTelEndpoint),
	}
	if cfg.OTelInsecure {
		exporterOptions = append(exporterOptions, otlptracegrpc.WithInsecure())
	}

	exporter, err := otlptracegrpc.New(ctx, exporterOptions...)
	if err != nil {
		return nil, fmt.Errorf("failed to create OTLP trace exporter: %w", err)
	}

	res, err := resource.New(
		ctx,
		resource.WithAttributes(
			semconv.ServiceName(cfg.OTelService),
			semconv.DeploymentEnvironmentName(string(cfg.AppEnv)),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to build telemetry resource: %w", err)
	}

	tracerProvider := trace.NewTracerProvider(
		trace.WithBatcher(exporter),
		trace.WithResource(res),
		trace.WithSampler(trace.TraceIDRatioBased(sampleRate)),
	)

	otel.SetTracerProvider(tracerProvider)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	logger.Info("OpenTelemetry tracing enabled",
		zap.String("service", cfg.OTelService),
		zap.String("endpoint", cfg.OTelEndpoint),
		zap.Float64("sample_rate", sampleRate),
	)

	return tracerProvider.Shutdown, nil
}
