package main

import (
	"fmt"
	"net/http"

	swaggerDocs "github.com/sitcon-tw/2026-game/docs"

	scalar "github.com/MarceloPetrucio/go-scalar-api-reference"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/internal/router"
	"github.com/sitcon-tw/2026-game/pkg/config"
	"github.com/sitcon-tw/2026-game/pkg/db"
	"github.com/sitcon-tw/2026-game/pkg/logger"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"go.uber.org/zap"
)

// @title SITGAME API
// @version 1.0
// @description This is the SITGAME API server
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @host localhost:8000
// @BasePath /api
// @schemes http https
func main() {
	cfg, err := config.Init()
	if err != nil {
		panic(err)
	}

	logger := logger.New()

	db, err := db.InitDatabase(logger)
	if err != nil {
		logger.Fatal("Failed to initialize database", zap.Error(err))
	}
	defer db.Close()

	repo := repository.New(db, logger)

	mux := initRoutes(repo, logger)

	handler := middleware.Logger(logger)(mux)

	logger.Info("Starting server",
		zap.String("port", cfg.AppPort),
		zap.String("env", string(cfg.AppEnv)),
	)

	http.ListenAndServe(fmt.Sprintf(":%s", cfg.AppPort), handler)
}

func initRoutes(repo repository.Repository, logger *zap.Logger) *http.ServeMux {
	root := http.NewServeMux()
	apiMux := http.NewServeMux()

	// Public routes
	apiMux.Handle("/users/", http.StripPrefix("/users", router.UserRoutes(repo, logger)))
	apiMux.Handle("/activities/", http.StripPrefix("/activities", router.ActivityRoutes(repo, logger)))

	// Authenticated route group
	protected := http.NewServeMux()
	protected.Handle("/friends/", http.StripPrefix("/friends", router.FriendRoutes(repo, logger)))
	protected.Handle("/game/", http.StripPrefix("/game", router.GameRoutes(repo, logger)))

	protectedHandler := middleware.Auth(repo, logger)(protected)
	// Protect only the above group
	apiMux.Handle("/friends/", protectedHandler)
	apiMux.Handle("/game/", protectedHandler)

	root.Handle("/api/", http.StripPrefix("/api", apiMux))

	if config.Env().AppEnv == config.AppEnvDev {
		root.Handle("/docs", scalarDocsHandler())
	}

	return root
}

func scalarDocsHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		html, err := scalar.ApiReferenceHTML(&scalar.Options{
			// Use generated swagger spec as inline content to avoid filesystem lookups
			SpecContent: swaggerDocs.SwaggerInfo.ReadDoc(),
			CustomOptions: scalar.CustomOptions{
				PageTitle: "SITGAME API Reference",
			},
			DarkMode: true,
		})
		if err != nil {
			zap.L().Error("failed to generate Scalar docs", zap.Error(err))
			http.Error(w, "could not render API reference", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(html))
	}
}
