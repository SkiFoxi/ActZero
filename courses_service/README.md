# Courses Service

Микросервис курсов для проекта ActZero. Работает на порту `:8082`.

## Быстрый старт

```bash
cd courses_service
cp .env.example .env
# Убедитесь что JWT_SECRET совпадает с auth-сервером!
go mod tidy
go run ./cmd/server
```

Или через Docker:
```bash
docker build -t courses_service .
docker run -p 8082:8082 --env-file .env courses_service
```

---

## API

Все защищённые эндпоинты требуют заголовок:
```
Authorization: Bearer <access_token>
```

Токен получается через auth-сервер (POST `/oauth/token`).

---

### GET /health
Проверка работоспособности сервиса. Авторизация не нужна.

```json
{ "status": "ok" }
```

---

### GET /courses
Список всех опубликованных курсов с прогрессом текущего пользователя.

**Response:**
```json
[
  {
    "id": "11111111-0000-0000-0000-000000000001",
    "title": "Основы кибербезопасности",
    "description": "...",
    "category": "Безопасность",
    "icon": "🛡️",
    "level": "beginner",
    "lesson_count": 4,
    "progress": 75.0
  }
]
```

---

### GET /courses/{courseID}
Один курс с уроками и прогрессом.

**Response:**
```json
{
  "course": { ... },
  "lessons": [
    {
      "id": "...",
      "title": "Что такое кибербезопасность?",
      "content": "<h2>...</h2>",
      "order_index": 1,
      "is_completed": true
    }
  ]
}
```

---

### POST /courses/{courseID}/lessons/{lessonID}/complete
Помечает урок как пройденный. Идемпотентный — повторный вызов не создаёт дубликат.

**Response:**
```json
{ "status": "completed" }
```

---

### GET /courses/{courseID}/quiz
Получить квиз курса. Правильные ответы НЕ возвращаются.

**Response:**
```json
{
  "quiz": {
    "id": "...",
    "title": "Проверка знаний",
    "questions": [
      {
        "id": "...",
        "text": "Что такое CIA триада?",
        "order_index": 1,
        "options": [
          { "id": "...", "text": "Конфиденциальность, Целостность, Доступность" },
          { "id": "...", "text": "..." }
        ]
      }
    ]
  },
  "best_attempt": null
}
```

---

### POST /courses/{courseID}/quiz/submit
Отправить ответы на квиз. Сохраняет попытку и возвращает результат.

**Request:**
```json
{
  "answers": [
    { "question_id": "...", "option_id": "..." },
    { "question_id": "...", "option_id": "..." }
  ]
}
```

**Response:**
```json
{
  "score": 3,
  "total": 4,
  "passed": true,
  "percent": 75,
  "message": "Отлично! Вы успешно прошли квиз 🎉"
}
```

Порог прохождения: **70%** правильных ответов.

---

## Admin API

Требуют роль `admin` в JWT-токене.

### POST /admin/courses
Создать новый курс (создаётся с `is_published: false`).

### PUT /admin/courses/{courseID}
Обновить курс. Можно обновить любое поле, включая `is_published`.

### POST /admin/lessons
Добавить урок к курсу.

### POST /admin/quizzes
Создать квиз с вопросами и вариантами ответов.

---

## Структура БД

```
courses          — курсы
lessons          — уроки курса
lesson_progress  — какие уроки прошёл пользователь
quizzes          — квизы (один на курс)
quiz_questions   — вопросы квиза
quiz_options     — варианты ответов
quiz_attempts    — попытки прохождения квиза
```

Сервис использует ту же PostgreSQL БД что и auth-сервер. Миграции применяются автоматически при старте.

---

## Роли пользователей

| Роль    | Доступ                                              |
|---------|-----------------------------------------------------|
| `user`  | Просмотр курсов, прохождение уроков, сдача квизов   |
| `admin` | Всё выше + создание/редактирование курсов и уроков  |

Роль читается из поля `role` в JWT-токене. Если поля нет — роль `user`.

Чтобы добавить роль в auth-сервер, нужно добавить колонку `role` в таблицу `users` и включить её в JWT-claims.
