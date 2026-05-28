package models

import "time"

// ─── Курс ────────────────────────────────────────────────────────────────────

type Course struct {
	ID          string    `json:"id" db:"id"`
	Title       string    `json:"title" db:"title"`
	Description string    `json:"description" db:"description"`
	Category    string    `json:"category" db:"category"`
	Icon        string    `json:"icon" db:"icon"`
	Level       string    `json:"level" db:"level"` // beginner, intermediate, advanced
	IsPublished bool      `json:"is_published" db:"is_published"`
	CreatedBy   string    `json:"created_by" db:"created_by"` // user_id автора (admin)
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`

	// Поля, вычисляемые при запросе
	LessonCount int     `json:"lesson_count" db:"lesson_count"`
	Progress    float64 `json:"progress" db:"progress"` // 0-100
}

// ─── Урок ─────────────────────────────────────────────────────────────────────

type Lesson struct {
	ID         string    `json:"id" db:"id"`
	CourseID   string    `json:"course_id" db:"course_id"`
	Title      string    `json:"title" db:"title"`
	Content    string    `json:"content" db:"content"` // HTML-контент урока
	OrderIndex int       `json:"order_index" db:"order_index"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`

	// Поля, вычисляемые при запросе (для конкретного пользователя)
	IsCompleted bool `json:"is_completed" db:"is_completed"`
}

// ─── Квиз ─────────────────────────────────────────────────────────────────────

type Quiz struct {
	ID       string         `json:"id" db:"id"`
	CourseID string         `json:"course_id" db:"course_id"`
	Title    string         `json:"title" db:"title"`
	Questions []QuizQuestion `json:"questions"`
}

type QuizQuestion struct {
	ID       string       `json:"id" db:"id"`
	QuizID   string       `json:"quiz_id" db:"quiz_id"`
	Text     string       `json:"text" db:"text"`
	Options  []QuizOption `json:"options"`
	OrderIndex int        `json:"order_index" db:"order_index"`
}

type QuizOption struct {
	ID         string `json:"id" db:"id"`
	QuestionID string `json:"question_id" db:"question_id"`
	Text       string `json:"text" db:"text"`
	IsCorrect  bool   `json:"is_correct,omitempty" db:"is_correct"` // omitempty — не отдаём клиенту
}

// ─── Прогресс ─────────────────────────────────────────────────────────────────

type LessonProgress struct {
	UserID      string    `json:"user_id" db:"user_id"`
	LessonID    string    `json:"lesson_id" db:"lesson_id"`
	CompletedAt time.Time `json:"completed_at" db:"completed_at"`
}

type QuizAttempt struct {
	ID          string    `json:"id" db:"id"`
	UserID      string    `json:"user_id" db:"user_id"`
	QuizID      string    `json:"quiz_id" db:"quiz_id"`
	Score       int       `json:"score" db:"score"`         // сколько правильных
	Total       int       `json:"total" db:"total"`         // всего вопросов
	Passed      bool      `json:"passed" db:"passed"`       // >= 70%
	CompletedAt time.Time `json:"completed_at" db:"completed_at"`
}

// ─── Запросы/ответы ───────────────────────────────────────────────────────────

type CompleteLessonRequest struct {
	LessonID string `json:"lesson_id"`
}

type SubmitQuizRequest struct {
	Answers []QuizAnswer `json:"answers"`
}

type QuizAnswer struct {
	QuestionID string `json:"question_id"`
	OptionID   string `json:"option_id"`
}

type QuizResult struct {
	Score   int    `json:"score"`
	Total   int    `json:"total"`
	Passed  bool   `json:"passed"`
	Percent int    `json:"percent"`
	Message string `json:"message"`
}

// Для ответа с правильными вариантами (показываем после сдачи)
type QuizOptionWithResult struct {
	QuizOption
	IsCorrect  bool   `json:"is_correct"`
	UserPicked bool   `json:"user_picked"`
}

// ─── Создание/обновление курсов (только для admin) ────────────────────────────

type CreateCourseRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Icon        string `json:"icon"`
	Level       string `json:"level"`
}

type UpdateCourseRequest struct {
	Title       *string `json:"title,omitempty"`
	Description *string `json:"description,omitempty"`
	Category    *string `json:"category,omitempty"`
	Icon        *string `json:"icon,omitempty"`
	Level       *string `json:"level,omitempty"`
	IsPublished *bool   `json:"is_published,omitempty"`
}

type CreateLessonRequest struct {
	CourseID   string `json:"course_id"`
	Title      string `json:"title"`
	Content    string `json:"content"`
	OrderIndex int    `json:"order_index"`
}

type CreateQuizRequest struct {
	CourseID  string              `json:"course_id"`
	Title     string              `json:"title"`
	Questions []CreateQuestionReq `json:"questions"`
}

type CreateQuestionReq struct {
	Text       string            `json:"text"`
	OrderIndex int               `json:"order_index"`
	Options    []CreateOptionReq `json:"options"`
}

type CreateOptionReq struct {
	Text      string `json:"text"`
	IsCorrect bool   `json:"is_correct"`
}
