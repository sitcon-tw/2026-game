package middleware

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
)

// TraceHandler creates a nested span for each routed handler.
func TraceHandler() func(http.Handler) http.Handler {
	handlerTracer := otel.Tracer("github.com/sitcon-tw/2026-game/handler")

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			spanName := fmt.Sprintf("%s %s", r.Method, r.URL.Path)
			ctx, span := handlerTracer.Start(r.Context(), spanName)
			defer span.End()

			r = r.WithContext(ctx)
			next.ServeHTTP(w, r)

			if routeCtx := chi.RouteContext(r.Context()); routeCtx != nil {
				if route := routeCtx.RoutePattern(); route != "" {
					span.SetName(fmt.Sprintf("%s %s", r.Method, route))
					span.SetAttributes(attribute.String("http.route", route))
				}
			}
		})
	}
}
