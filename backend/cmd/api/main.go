package main

import (
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/go-chi/httprate"
	"github.com/sitcon-tw/2026-game/internal/repository"
	"github.com/sitcon-tw/2026-game/internal/router"
	"github.com/sitcon-tw/2026-game/pkg/config"
	"github.com/sitcon-tw/2026-game/pkg/db"
	"github.com/sitcon-tw/2026-game/pkg/logger"
	"github.com/sitcon-tw/2026-game/pkg/middleware"
	"go.uber.org/zap"
)

const (
	readTimeout       = 15 * time.Second
	readHeaderTimeout = 5 * time.Second
	writeTimeout      = 15 * time.Second
	idleTimeout       = 60 * time.Second
	maxAge            = 300
)

// @title SITGAME API
// @version 1.0
// @description This is the SITGAME API server

// @contact.name API Support
// @contact.url https://sitcon.org
// @contact.email contact@sitcon.org

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

	server := &http.Server{
		Addr:              fmt.Sprintf(":%s", cfg.AppPort),
		Handler:           handler,
		ReadTimeout:       readTimeout,
		ReadHeaderTimeout: readHeaderTimeout,
		WriteTimeout:      writeTimeout,
		IdleTimeout:       idleTimeout,
	}

	err = server.ListenAndServe()
	if err != nil {
		logger.Fatal("server stopped unexpectedly", zap.Error(err))
	}
}

func initRoutes(repo repository.Repository, logger *zap.Logger) http.Handler {
	r := chi.NewRouter()
	// logger
	r.Use(middleware.Logger(logger))

	// CORS
	if config.Env().AppEnv == config.AppEnvDev {
		//nolint:golines // keep struct aligned
		corsMiddleware := cors.Handler(cors.Options{
			AllowedOrigins:   config.Env().CORSAllowedOrigins,
			AllowedMethods:   []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete, http.MethodOptions},
			AllowedHeaders:   []string{"Authorization", "Content-Type"},
			AllowCredentials: true,
			MaxAge:           maxAge,
		})
		r.Use(corsMiddleware)
	}

	// Rate limit
	r.Use(httprate.LimitByIP(
		config.Env().RateLimitRequestsPerWindow,
		config.Env().RateLimitWindow,
	))

	// Routes
	r.Route("/api", func(r chi.Router) {
		r.Mount("/users", router.UserRoutes(repo, logger))
		r.Mount("/activities", router.ActivityRoutes(repo, logger))
		r.Mount("/discount-coupons", router.DiscountRoutes(repo, logger))

		r.Mount("/friendships", router.FriendRoutes(repo, logger))
		r.Mount("/games", router.GameRoutes(repo, logger))
	})

	// Swagger API docs
	if config.Env().AppEnv == config.AppEnvDev {
		// Serve raw swagger spec at /docs for quick downloads
		r.Get("/docs", func(w http.ResponseWriter, r *http.Request) {
			http.ServeFile(w, r, "docs/swagger.yaml")
		})

		// Serve static API docs (index.html + swagger assets) under /docs/
		r.Get("/docs/*", http.StripPrefix("/docs", http.FileServer(http.Dir("docs"))).ServeHTTP)

		logger.Info("API documentation available at http://localhost:" + config.Env().AppPort + "/docs/")
	}

	return r
}
