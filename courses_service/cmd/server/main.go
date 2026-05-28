package main

import (
	"database/sql"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"

	"courses_service/internal/config"
	"courses_service/internal/handlers"
	"courses_service/internal/middleware"
	"courses_service/internal/storage"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	// Загружаем .env если есть
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, using environment variables")
	}

	cfg := config.Load()

	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	// Подключаемся к БД
	store, err := storage.New(cfg.DatabaseURL)
	if err != nil {
		logger.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer store.Close()
	logger.Info("connected to database")

	// Прогоняем миграции
	if err := runMigrations(cfg.DatabaseURL); err != nil {
		logger.Error("failed to run migrations", "error", err)
		os.Exit(1)
	}
	logger.Info("migrations applied")

	// Инициализируем хендлеры
	h := handlers.New(store)

	// Собираем роутер
	r := chi.NewRouter()

	// Глобальные middleware
	r.Use(chiMiddleware.Recoverer)
	r.Use(chiMiddleware.Logger)
	r.Use(middleware.CORS)
	r.Use(middleware.JSON)

	// Health check (без авторизации)
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Защищённые роуты — требуют валидный JWT
	r.Group(func(r chi.Router) {
		r.Use(middleware.Auth(cfg.JWTSecret))

		// ── Курсы (для всех авторизованных) ──────────────────────────────────
		r.Get("/courses", h.ListCourses)
		r.Get("/courses/{courseID}", h.GetCourse)

		// ── Прогресс ──────────────────────────────────────────────────────────
		r.Post("/courses/{courseID}/lessons/{lessonID}/complete", h.CompleteLesson)

		// ── Квиз ──────────────────────────────────────────────────────────────
		r.Get("/courses/{courseID}/quiz", h.GetQuiz)
		r.Post("/courses/{courseID}/quiz/submit", h.SubmitQuiz)

		// ── Admin-роуты (требуют роль admin) ──────────────────────────────────
		r.Group(func(r chi.Router) {
			r.Use(middleware.AdminOnly)

			r.Post("/admin/courses", h.AdminCreateCourse)
			r.Put("/admin/courses/{courseID}", h.AdminUpdateCourse)
			r.Post("/admin/lessons", h.AdminCreateLesson)
			r.Post("/admin/quizzes", h.AdminCreateQuiz)
		})
	})

	addr := fmt.Sprintf(":%s", cfg.Port)
	logger.Info("courses service starting", "addr", addr)

	if err := http.ListenAndServe(addr, r); err != nil {
		logger.Error("server failed", "error", err)
		os.Exit(1)
	}
}

func runMigrations(databaseURL string) error {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return err
	}
	defer db.Close()

	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return err
	}

	m, err := migrate.NewWithDatabaseInstance(
		"file://migrations",
		"postgres", driver,
	)
	if err != nil {
		return err
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return err
	}
	return nil
}
