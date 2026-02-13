package users

import (
	"github.com/sitcon-tw/2026-game/internal/repository"
	"go.uber.org/zap"
)

// Handler handles user-related requests.
type Handler struct {
	Repo   repository.Repository
	Logger *zap.Logger
}

// New wires required dependencies for the user handler.
func New(repo repository.Repository, logger *zap.Logger) *Handler {
	return &Handler{Repo: repo, Logger: logger}
}
