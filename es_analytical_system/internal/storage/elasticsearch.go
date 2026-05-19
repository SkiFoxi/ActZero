// Package storage содержит реализации хранилищ для Elasticsearch/OpenSearch и PostgreSQL.
package storage

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/akozadaev/go_es_analytical_system/internal/config"
	"github.com/akozadaev/go_es_analytical_system/internal/models"
	"github.com/elastic/go-elasticsearch/v8"
)

// ElasticsearchStorage предоставляет методы для работы с Elasticsearch/OpenSearch.
// Использует прямые HTTP запросы для совместимости с OpenSearch.
type ElasticsearchStorage struct {
	client     *elasticsearch.Client
	index      string
	httpClient *http.Client
	baseURL    string

	// Коэффициенты scoring — загружаются из конфига
	scoreTrafficWeight     float64
	scoreCompetitionWeight float64
	scoreNormalizeDivisor  float64
}

// NewElasticsearchStorageWithURL создает новый экземпляр ElasticsearchStorage с указанным URL.
// Использует коэффициенты scoring из конфига.
func NewElasticsearchStorageWithURL(client *elasticsearch.Client, index string, baseURL string, cfg *config.Config) *ElasticsearchStorage {
	return &ElasticsearchStorage{
		client:                 client,
		index:                  index,
		httpClient:             &http.Client{},
		baseURL:                baseURL,
		scoreTrafficWeight:     cfg.ScoreTrafficWeight,
		scoreCompetitionWeight: cfg.ScoreCompetitionWeight,
		scoreNormalizeDivisor:  cfg.ScoreNormalizeDivisor,
	}
}

// NewElasticsearchStorage создает новый экземпляр ElasticsearchStorage с URL по умолчанию.
func NewElasticsearchStorage(client *elasticsearch.Client, index string, cfg *config.Config) *ElasticsearchStorage {
	return NewElasticsearchStorageWithURL(client, index, "http://localhost:9200", cfg)
}

// CreateIndex создает индекс в Elasticsearch/OpenSearch с заданным маппингом.
// Если индекс уже существует, функция возвращает nil без ошибки.
func (es *ElasticsearchStorage) CreateIndex(ctx context.Context, mappingJSON string) error {
	res, err := es.client.Indices.Exists([]string{es.index})
	if err != nil {
		return fmt.Errorf("failed to check index existence: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode == 200 {
		// Индекс уже существует
		return nil
	}

	// Создаем индекс с маппингом
	res, err = es.client.Indices.Create(
		es.index,
		es.client.Indices.Create.WithBody(strings.NewReader(mappingJSON)),
		es.client.Indices.Create.WithContext(ctx),
	)
	if err != nil {
		return fmt.Errorf("failed to create index: %w", err)
	}
	defer res.Body.Close()

	if res.IsError() {
		body, _ := io.ReadAll(res.Body)
		return fmt.Errorf("error creating index: %s", string(body))
	}

	return nil
}

// IndexLocation индексирует одну локацию в Elasticsearch/OpenSearch.
// Если локация с таким ID уже существует, она будет обновлена (upsert).
// Использует прямой HTTP запрос для совместимости с OpenSearch.
func (es *ElasticsearchStorage) IndexLocation(ctx context.Context, location *models.Location) error {
	body, err := json.Marshal(location)
	if err != nil {
		return fmt.Errorf("failed to marshal location: %w", err)
	}

	url := fmt.Sprintf("%s/%s/_doc/%s?refresh=true", es.baseURL, es.index, location.ID)
	req, err := http.NewRequestWithContext(ctx, "PUT", url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	res, err := es.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to index location: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode >= 400 {
		respBody, _ := io.ReadAll(res.Body)
		return fmt.Errorf("error indexing location: status %d, body: %s", res.StatusCode, string(respBody))
	}

	return nil
}

// DeleteLocation удаляет локацию по её идентификатору.
// Возвращает ошибку "location not found", если документ не существует.
// Использует прямой HTTP запрос для совместимости с OpenSearch.
func (es *ElasticsearchStorage) DeleteLocation(ctx context.Context, id string) error {
	url := fmt.Sprintf("%s/%s/_doc/%s?refresh=true", es.baseURL, es.index, id)
	req, err := http.NewRequestWithContext(ctx, "DELETE", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	res, err := es.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to delete location: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode == 404 {
		return fmt.Errorf("location not found")
	}

	if res.StatusCode >= 400 {
		respBody, _ := io.ReadAll(res.Body)
		return fmt.Errorf("error deleting location: status %d, body: %s", res.StatusCode, string(respBody))
	}

	return nil
}

// ListAllLocations возвращает все локации из индекса.
// Используется для отрисовки меток на пользовательской карте.
// limit — максимальное количество результатов (при 0 используется 1000).
// Использует прямой HTTP запрос для совместимости с OpenSearch.
func (es *ElasticsearchStorage) ListAllLocations(ctx context.Context, limit int) ([]*models.Location, error) {
	if limit <= 0 {
		limit = 1000
	}

	// Новый рейтинг: трафик 40%, демография 30%, низкая конкуренция 20%, интересы 10%.
	script := `
		double traffic = doc['traffic_score'].value * 0.4;
		double demographics = ((doc['demographics.population_density'].value / 1000.0) + (doc['demographics.average_income'].value / 100000.0)) * 0.3;
		double competition = (1.0 - (doc['competition_density'].value / 10.0)) * 0.2;
		double interests = 0.1;
		double rating = (traffic + demographics + competition + interests) * 10;
		return Math.min(rating, 100.0);
	`

	query := map[string]interface{}{
		"query": map[string]interface{}{
			"function_score": map[string]interface{}{
				"query": map[string]interface{}{
					"match_all": map[string]interface{}{},
				},
				"script_score": map[string]interface{}{
					"script": map[string]interface{}{
						"source": script,
					},
				},
				"boost_mode": "replace",
			},
		},
	}

	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(query); err != nil {
		return nil, fmt.Errorf("failed to encode query: %w", err)
	}

	url := fmt.Sprintf("%s/%s/_search?size=%d", es.baseURL, es.index, limit)
	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, &buf)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	res, err := es.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to list locations: %w", err)
	}
	defer res.Body.Close()

	// Если индекс ещё не создан — возвращаем пустой список, а не ошибку.
	if res.StatusCode == 404 {
		return []*models.Location{}, nil
	}

	if res.StatusCode >= 400 {
		respBody, _ := io.ReadAll(res.Body)
		return nil, fmt.Errorf("error listing locations: status %d, body: %s", res.StatusCode, string(respBody))
	}

	var result struct {
		Hits struct {
			Hits []struct {
				Source models.Location `json:"_source"`
				Score  float64         `json:"_score"`
			} `json:"hits"`
		} `json:"hits"`
	}

	if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	locations := make([]*models.Location, 0, len(result.Hits.Hits))
	for _, hit := range result.Hits.Hits {
		loc := hit.Source
		loc.Score = hit.Score // _score приходит от OpenSearch
		locations = append(locations, &loc)
	}

	return locations, nil
}

// BulkIndexLocations индексирует несколько локаций за один запрос.
// Использует Bulk API для эффективной массовой индексации.
// Использует прямые HTTP запросы для совместимости с OpenSearch.
func (es *ElasticsearchStorage) BulkIndexLocations(ctx context.Context, locations []*models.Location) error {
	var buf bytes.Buffer

	for _, location := range locations {
		meta := map[string]interface{}{
			"index": map[string]interface{}{
				"_index": es.index,
				"_id":    location.ID,
			},
		}

		if err := json.NewEncoder(&buf).Encode(meta); err != nil {
			return fmt.Errorf("failed to encode meta: %w", err)
		}

		if err := json.NewEncoder(&buf).Encode(location); err != nil {
			return fmt.Errorf("failed to encode location: %w", err)
		}
	}

	// Используем прямой HTTP запрос для обхода проверки типа сервера
	url := fmt.Sprintf("%s/_bulk", es.baseURL)
	req, err := http.NewRequestWithContext(ctx, "POST", url, &buf)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-ndjson")

	res, err := es.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to bulk index: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode >= 400 {
		body, _ := io.ReadAll(res.Body)
		return fmt.Errorf("error bulk indexing: status %d, body: %s", res.StatusCode, string(body))
	}

	return nil
}

// GetLocation получает локацию по её уникальному идентификатору.
// Возвращает ошибку, если локация не найдена.
// Использует прямой HTTP запрос для совместимости с OpenSearch.
func (es *ElasticsearchStorage) GetLocation(ctx context.Context, id string) (*models.Location, error) {
	// Используем прямой HTTP запрос для обхода проверки типа сервера
	url := fmt.Sprintf("%s/%s/_doc/%s", es.baseURL, es.index, id)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	res, err := es.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get location: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode == 404 {
		return nil, fmt.Errorf("location not found")
	}

	if res.StatusCode >= 400 {
		body, _ := io.ReadAll(res.Body)
		return nil, fmt.Errorf("error getting location: status %d, body: %s", res.StatusCode, string(body))
	}

	var result struct {
		Found  bool            `json:"found"`
		Source models.Location `json:"_source"`
	}

	if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if !result.Found {
		return nil, fmt.Errorf("location not found")
	}

	return &result.Source, nil
}

// RecommendLocations выполняет поиск и ранжирование локаций на основе критериев запроса.
// Использует комбинированное ранжирование по traffic_score, competition_density и демографии.
// Использует прямые HTTP запросы для совместимости с OpenSearch.
func (es *ElasticsearchStorage) RecommendLocations(ctx context.Context, req *models.RecommendRequest) ([]*models.Location, error) {
	query := es.buildRecommendQuery(req)

	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(query); err != nil {
		return nil, fmt.Errorf("failed to encode query: %w", err)
	}

	// Используем прямой HTTP запрос для обхода проверки типа сервера
	url := fmt.Sprintf("%s/%s/_search?size=%d", es.baseURL, es.index, req.Limit)
	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, &buf)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	res, err := es.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to search: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode >= 400 {
		body, _ := io.ReadAll(res.Body)
		return nil, fmt.Errorf("error searching: status %d, body: %s", res.StatusCode, string(body))
	}

	var result struct {
		Hits struct {
			Total struct {
				Value int `json:"value"`
			} `json:"total"`
			Hits []struct {
				Source models.Location `json:"_source"`
				Score  float64         `json:"_score"`
			} `json:"hits"`
		} `json:"hits"`
	}

	if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	locations := make([]*models.Location, 0, len(result.Hits.Hits))
	for _, hit := range result.Hits.Hits {
		location := hit.Source
		location.Score = hit.Score
		locations = append(locations, &location)
	}

	return locations, nil
}

// buildRecommendQuery строит запрос для рекомендаций
func (es *ElasticsearchStorage) buildRecommendQuery(req *models.RecommendRequest) map[string]interface{} {
	mustClauses := []map[string]interface{}{}
	shouldClauses := []map[string]interface{}{}

	// Фильтр по региону
	if req.Region != "" {
		mustClauses = append(mustClauses, map[string]interface{}{
			"term": map[string]interface{}{
				"region": req.Region,
			},
		})
	}

	// Фильтр по городу (если указан)
	if req.City != "" {
		mustClauses = append(mustClauses, map[string]interface{}{
			"term": map[string]interface{}{
				"city": req.City,
			},
		})
	}

	// Фильтр по типу бизнеса
	if req.BusinessType != "" {
		mustClauses = append(mustClauses, map[string]interface{}{
			"term": map[string]interface{}{
				"business_types_suitable": req.BusinessType,
			},
		})
	}

	// Бустинг для высокого traffic_score и низкого competition_density
	shouldClauses = append(shouldClauses, map[string]interface{}{
		"range": map[string]interface{}{
			"traffic_score": map[string]interface{}{
				"gte":   7.0,
				"boost": 2.0,
			},
		},
	})

	shouldClauses = append(shouldClauses, map[string]interface{}{
		"range": map[string]interface{}{
			"competition_density": map[string]interface{}{
				"lte":   3.0,
				"boost": 1.5,
			},
		},
	})

	query := map[string]interface{}{
		"query": map[string]interface{}{
			"bool": map[string]interface{}{
				"must":                 mustClauses,
				"should":               shouldClauses,
				"minimum_should_match": 0,
			},
		},
		"sort": []map[string]interface{}{
			{
				"_score": map[string]interface{}{
					"order": "desc",
				},
			},
			{
				"traffic_score": map[string]interface{}{
					"order": "desc",
				},
			},
			{
				"competition_density": map[string]interface{}{
					"order": "asc",
				},
			},
		},
	}

	if req.Limit == 0 {
		req.Limit = 20 // Значение по умолчанию
	}

	return query
}
