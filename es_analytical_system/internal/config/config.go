// Package config предоставляет загрузку конфигурации приложения из переменных окружения.
package config

import (
	"os"
	"strconv"

	"ollamaclient"
)

// Config содержит все параметры конфигурации приложения.
// Значения загружаются из переменных окружения с fallback на значения по умолчанию.
type Config struct {
	ElasticsearchURL string // URL для подключения к Elasticsearch/OpenSearch
	PostgresHost     string // Хост PostgreSQL
	PostgresPort     string // Порт PostgreSQL
	PostgresUser     string // Пользователь PostgreSQL
	PostgresPassword string // Пароль PostgreSQL
	PostgresDB       string // Имя базы данных PostgreSQL
	AppPort          string // Порт для HTTP сервера

	// Readiness check parameters
	ReadinessDBTimeoutSec  int    // Таймаут для проверки БД в секундах
	ReadinessDiskPath      string // Путь для проверки диска
	ReadinessDiskMinFreeMB int    // Минимальное свободное место на диске в MB
	ReadinessRAMMinFreeMB  int    // Минимальная свободная оперативная память в MB
	BuildVersion           string // Версия сборки
	GitCommit              string // Хэш коммита Git

	// Scoring — коэффициенты для расчёта рейтинга локаций в OpenSearch
	ScoreTrafficWeight     float64 // Вес traffic_score (по умолчанию 0.7)
	ScoreCompetitionWeight float64 // Вес competition_density (по умолчанию 0.3)
	ScoreNormalizeDivisor  float64 // Делитель для нормализации в [0,1] (по умолчанию 7.0)

	// Ollama (OpenAI-совместимый API через go_ollama_client)
	OllamaBaseURL           string // Базовый URL, например http://localhost:11434/v1
	OllamaChatModel         string // Модель для чата
	OllamaAutocompleteModel string // Модель для автодополнения кода
	OllamaEmbedModel        string // Модель для эмбеддингов (на будущее)

	// DeepSeek
	DeepSeekAPIKey  string // API key for server-side DeepSeek requests
	DeepSeekBaseURL string // DeepSeek API base URL
	DeepSeekModel   string // Chat model for DeepSeek
}

// Load загружает конфигурацию из переменных окружения.
// Если переменная не установлена, используется значение по умолчанию.
func Load() *Config {
	return &Config{
		ElasticsearchURL: getEnv("ELASTICSEARCH_URL", "http://localhost:9200"),
		PostgresHost:     getEnv("POSTGRES_HOST", "localhost"),
		PostgresPort:     getEnv("POSTGRES_PORT", "5432"),
		PostgresUser:     getEnv("POSTGRES_USER", "analytical_user"),
		PostgresPassword: getEnv("POSTGRES_PASSWORD", "analytical_pass"),
		PostgresDB:       getEnv("POSTGRES_DB", "analytical_db"),
		AppPort:          getEnv("APP_PORT", "8080"),

		ReadinessDBTimeoutSec:  getEnvInt("READINESS_DB_TIMEOUT_SEC", 5),
		ReadinessDiskPath:      getEnv("READINESS_DISK_PATH", "."),
		ReadinessDiskMinFreeMB: getEnvInt("READINESS_DISK_MIN_FREE_MB", 100),
		ReadinessRAMMinFreeMB:  getEnvInt("READINESS_RAM_MIN_FREE_MB", 50),
		BuildVersion:           getEnv("BUILD_VERSION", "dev"),
		GitCommit:              getEnv("GIT_COMMIT", ""),

		OllamaBaseURL:           getEnv("OLLAMA_BASE_URL", ""),
		OllamaChatModel:         getEnv("OLLAMA_CHAT_MODEL", ""),
		OllamaAutocompleteModel: getEnv("OLLAMA_AUTOCOMPLETE_MODEL", ""),
		OllamaEmbedModel:        getEnv("OLLAMA_EMBED_MODEL", ""),

		DeepSeekAPIKey:  getEnv("DEEPSEEK_API_KEY", "sk-3afe2f8170f14b2baada9a17c40c0f85"),
		DeepSeekBaseURL: getEnv("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
		DeepSeekModel:   getEnv("DEEPSEEK_MODEL", "deepseek-v4-flash"),

		ScoreTrafficWeight:     getEnvFloat("SCORE_TRAFFIC_WEIGHT", 0.7),
		ScoreCompetitionWeight: getEnvFloat("SCORE_COMPETITION_WEIGHT", 0.3),
		ScoreNormalizeDivisor:  getEnvFloat("SCORE_NORMALIZE_DIVISOR", 7.0),
	}
}

// OllamaClientConfig собирает конфигурацию для ollamaclient: значения из .env через ollamaclient.DefaultConfig().
func (c *Config) OllamaClientConfig() ollamaclient.OllamaConfig {
	dc := ollamaclient.DefaultConfig()
	if c.OllamaBaseURL != "" {
		dc.BaseURL = c.OllamaBaseURL
	}
	if c.OllamaChatModel != "" {
		dc.ChatModel = c.OllamaChatModel
	}
	if c.OllamaAutocompleteModel != "" {
		dc.AutocompleteModel = c.OllamaAutocompleteModel
	}
	if c.OllamaEmbedModel != "" {
		dc.EmbedModel = c.OllamaEmbedModel
	}
	return dc
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}

func getEnvFloat(key string, defaultValue float64) float64 {
	if value := os.Getenv(key); value != "" {
		if floatVal, err := strconv.ParseFloat(value, 64); err == nil {
			return floatVal
		}
	}
	return defaultValue
}
