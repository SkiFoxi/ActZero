
# ActZero

## Архитектура

Проект состоит из двух независимых микросервисов и статического фронтенда.

```
┌─────────────────────────────────────────────────────────────┐
│                        Браузер                              │
│                  (index.html, lkabinet, map, adminPanel)    │
└───────────────┬──────────────────────────┬──────────────────┘
                │                          │
                │ login/profile            │ метки
                ▼                          ▼
       ┌────────────────────┐     ┌──────────────────────────┐
       │ go_oauth2_server   │     │  es_analytical_system    │
       │   :8081            │     │    :8080                 │
       │   Postgres :5433   │     │  Postgres :5432          │
       │                    │     │  OpenSearch :9200        │
       └────────────────────┘     └──────────────────────────┘
```

- **`go_oauth2_server-main`** — OAuth2 + JWT, пользователи и логин
- **`es_analytical_system`** — хранилище и рекомендации локаций (OpenSearch + PostgreSQL)
- Сервисы **не общаются между собой напрямую** — только через браузер.

## Роли и вход

Отдельного окна админ-входа нет. Вход **одинаковый для всех**: модалка «Войти» с `index.html`.

- Пользователь `admin` / `admin` → фронт после логина видит `username === "admin"` и редиректит в `/htmllist/adminPanel.html`.
- Все остальные → `/htmllist/lkabinet.html`.

Учётка `admin` создаётся миграцией `go_oauth2_server-main/migrations/003_add_roles.up.sql`.

## Запуск

Два отдельных docker-compose — так и задумано, у каждого своя Docker-сеть, они изолированы:

```bash
# 1) OAuth-сервер
cd go_oauth2_server-main
docker-compose up -d

# 2) Аналитический сервис (OpenSearch + Postgres + app)
cd ../es_analytical_system
docker-compose up -d
```

Фронт — статика. Откройте `index.html` через любой локальный web-server
(например `python3 -m http.server 8000` из корня `ActZero/`)
и заходите на `http://localhost:8000/index.html`.

## Админ-панель: что умеет

- Клик по карте → модалка с полным набором полей `Location`
  (name, address, region, city, description, business_types_suitable,
  traffic_score, competition_density, demographics).
- Адрес/город/регион автозаполняются через `ymaps.geocode`.
- CRUD через REST: `POST /locations`, `DELETE /locations/{id}`, `GET /locations`.
- Метки сохраняются в OpenSearch (индекс `locations`) и **сразу же видны
  всем пользователям** на обычной карте (`map.html`).

## Важное про OpenSearch vs Elasticsearch

`es_analytical_system` использует **OpenSearch 2.11**, хотя переменная среды
называется `ELASTICSEARCH_URL` и импортируется клиент `go-elasticsearch/v8`.
Это совместимо по REST API, но клиент go-elasticsearch v8 проверяет
тип сервера по заголовку `X-elastic-product` — поэтому во всех методах
storage используются прямые `http.Client` запросы в обход клиента.

Если решите переходить на «чистый» OpenSearch-клиент —
`github.com/opensearch-project/opensearch-go/v3`, это отдельная задача.
