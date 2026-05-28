package handlers

import (
	"encoding/json"
	"net/http"

	"courses_service/internal/middleware"
	"courses_service/internal/models"
	"courses_service/internal/storage"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	store *storage.Store
}

func New(store *storage.Store) *Handler {
	return &Handler{store: store}
}

// respond — хелпер для JSON-ответов
func respond(w http.ResponseWriter, status int, data interface{}) {
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// respondError — хелпер для ошибок
func respondError(w http.ResponseWriter, status int, message string) {
	respond(w, status, map[string]string{"error": message})
}

// ─── Курсы (публичные для авторизованных) ────────────────────────────────────

// GET /courses
// Возвращает список всех опубликованных курсов с прогрессом текущего пользователя
func (h *Handler) ListCourses(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)

	courses, err := h.store.ListCourses(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to load courses")
		return
	}

	// Если курсов нет — возвращаем пустой массив, не null
	if courses == nil {
		courses = []models.Course{}
	}
	respond(w, http.StatusOK, courses)
}

// GET /courses/{courseID}
// Возвращает один курс с уроками и прогрессом
func (h *Handler) GetCourse(w http.ResponseWriter, r *http.Request) {
	courseID := chi.URLParam(r, "courseID")
	userID := middleware.GetUserID(r)

	course, err := h.store.GetCourse(r.Context(), courseID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to load course")
		return
	}
	if course == nil || (!course.IsPublished && middleware.GetUserRole(r) != "admin") {
		respondError(w, http.StatusNotFound, "course not found")
		return
	}

	lessons, err := h.store.GetLessons(r.Context(), courseID, userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to load lessons")
		return
	}
	if lessons == nil {
		lessons = []models.Lesson{}
	}

	// Считаем прогресс
	completed := 0
	for _, l := range lessons {
		if l.IsCompleted {
			completed++
		}
	}
	progress := 0.0
	if len(lessons) > 0 {
		progress = float64(completed) / float64(len(lessons)) * 100
	}
	course.Progress = progress
	course.LessonCount = len(lessons)

	respond(w, http.StatusOK, map[string]interface{}{
		"course":  course,
		"lessons": lessons,
	})
}

// ─── Прогресс ─────────────────────────────────────────────────────────────────

// POST /courses/{courseID}/lessons/{lessonID}/complete
// Помечает урок как пройденный
func (h *Handler) CompleteLesson(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	lessonID := chi.URLParam(r, "lessonID")

	if err := h.store.CompleteLesson(r.Context(), userID, lessonID); err != nil {
		respondError(w, http.StatusInternalServerError, "failed to save progress")
		return
	}

	respond(w, http.StatusOK, map[string]string{"status": "completed"})
}

// ─── Квиз ─────────────────────────────────────────────────────────────────────

// GET /courses/{courseID}/quiz
// Возвращает квиз курса (без правильных ответов)
func (h *Handler) GetQuiz(w http.ResponseWriter, r *http.Request) {
	courseID := chi.URLParam(r, "courseID")

	quiz, err := h.store.GetQuiz(r.Context(), courseID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to load quiz")
		return
	}
	if quiz == nil {
		respondError(w, http.StatusNotFound, "quiz not found for this course")
		return
	}

	// Проверяем, есть ли уже пройденная попытка
	userID := middleware.GetUserID(r)
	bestAttempt, _ := h.store.GetBestQuizAttempt(r.Context(), userID, quiz.ID)

	respond(w, http.StatusOK, map[string]interface{}{
		"quiz":        quiz,
		"best_attempt": bestAttempt, // nil если ещё не проходил
	})
}

// POST /courses/{courseID}/quiz/submit
// Принимает ответы, проверяет и возвращает результат
func (h *Handler) SubmitQuiz(w http.ResponseWriter, r *http.Request) {
	courseID := chi.URLParam(r, "courseID")
	userID := middleware.GetUserID(r)

	// Находим квиз по courseID
	quiz, err := h.store.GetQuiz(r.Context(), courseID)
	if err != nil || quiz == nil {
		respondError(w, http.StatusNotFound, "quiz not found")
		return
	}

	var req models.SubmitQuizRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	result, err := h.store.SubmitQuiz(r.Context(), userID, quiz.ID, req.Answers)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to submit quiz")
		return
	}

	respond(w, http.StatusOK, result)
}

// ─── Admin: Курсы ─────────────────────────────────────────────────────────────

// POST /admin/courses
func (h *Handler) AdminCreateCourse(w http.ResponseWriter, r *http.Request) {
	adminID := middleware.GetUserID(r)

	var req models.CreateCourseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Title == "" {
		respondError(w, http.StatusBadRequest, "title is required")
		return
	}

	course, err := h.store.CreateCourse(r.Context(), req, adminID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create course")
		return
	}
	respond(w, http.StatusCreated, course)
}

// PUT /admin/courses/{courseID}
func (h *Handler) AdminUpdateCourse(w http.ResponseWriter, r *http.Request) {
	courseID := chi.URLParam(r, "courseID")

	var req models.UpdateCourseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	course, err := h.store.UpdateCourse(r.Context(), courseID, req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to update course")
		return
	}
	respond(w, http.StatusOK, course)
}

// POST /admin/lessons
func (h *Handler) AdminCreateLesson(w http.ResponseWriter, r *http.Request) {
	var req models.CreateLessonRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.CourseID == "" || req.Title == "" {
		respondError(w, http.StatusBadRequest, "course_id and title are required")
		return
	}

	lesson, err := h.store.CreateLesson(r.Context(), req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create lesson")
		return
	}
	respond(w, http.StatusCreated, lesson)
}

// POST /admin/quizzes
func (h *Handler) AdminCreateQuiz(w http.ResponseWriter, r *http.Request) {
	var req models.CreateQuizRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.CourseID == "" || req.Title == "" {
		respondError(w, http.StatusBadRequest, "course_id and title are required")
		return
	}

	quiz, err := h.store.CreateQuiz(r.Context(), req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create quiz")
		return
	}
	respond(w, http.StatusCreated, quiz)
}
