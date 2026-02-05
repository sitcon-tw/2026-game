package main

import (
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/httprate"
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

// @contact.name API Support
// @contact.url https://sitcon.org
// @contact.email contact@sitcon.org

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

	handler := initRoutes(repo, logger)

	logger.Info("Starting server",
		zap.String("port", cfg.AppPort),
		zap.String("env", string(cfg.AppEnv)),
	)

	http.ListenAndServe(fmt.Sprintf(":%s", cfg.AppPort), handler)
}

func initRoutes(repo repository.Repository, logger *zap.Logger) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Logger(logger))
	r.Use(httprate.LimitByIP(10, 5*time.Second))

	r.Route("/api", func(r chi.Router) {
		r.Mount("/users", router.UserRoutes(repo, logger))
		r.Mount("/activities", router.ActivityRoutes(repo, logger))
		r.Mount("/discount", router.DiscountRoutes(repo, logger))

		r.Mount("/friends", router.FriendRoutes(repo, logger))
		r.Mount("/game", router.GameRoutes(repo, logger))
	})

	if config.Env().AppEnv == config.AppEnvDev {
		r.Get("/docs", scalarDocsHandler())
	}

	return r
}

func scalarDocsHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		html, err := scalar.ApiReferenceHTML(&scalar.Options{
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
