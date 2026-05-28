package storage

import (
	"context"
	"database/sql"
	"fmt"

	"courses_service/internal/models"

	_ "github.com/lib/pq"
)

type Store struct {
	db *sql.DB
}

func New(databaseURL string) (*Store, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	return &Store{db: db}, nil
}

func (s *Store) Close() {
	s.db.Close()
}

// ─── Курсы ────────────────────────────────────────────────────────────────────

func (s *Store) ListCourses(ctx context.Context, userID string) ([]models.Course, error) {
	query := `
		SELECT
			c.id, c.title, c.description, c.category, c.icon, c.level,
			c.is_published, COALESCE(c.created_by::text, '') as created_by,
			c.created_at, c.updated_at,
			COUNT(DISTINCT l.id) AS lesson_count,
			COALESCE(
				ROUND(
					COUNT(DISTINCT lp.lesson_id)::numeric /
					NULLIF(COUNT(DISTINCT l.id), 0) * 100
				), 0
			) AS progress
		FROM courses c
		LEFT JOIN lessons l ON l.course_id = c.id
		LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $1
		WHERE c.is_published = true
		GROUP BY c.id
		ORDER BY c.created_at DESC
	`
	rows, err := s.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("list courses: %w", err)
	}
	defer rows.Close()

	var courses []models.Course
	for rows.Next() {
		var c models.Course
		if err := rows.Scan(
			&c.ID, &c.Title, &c.Description, &c.Category, &c.Icon, &c.Level,
			&c.IsPublished, &c.CreatedBy, &c.CreatedAt, &c.UpdatedAt,
			&c.LessonCount, &c.Progress,
		); err != nil {
			return nil, fmt.Errorf("scan course: %w", err)
		}
		courses = append(courses, c)
	}
	return courses, rows.Err()
}

func (s *Store) GetCourse(ctx context.Context, courseID string) (*models.Course, error) {
	query := `
		SELECT id, title, description, category, icon, level,
		       is_published, COALESCE(created_by::text, '') as created_by,
		       created_at, updated_at
		FROM courses WHERE id = $1
	`
	var c models.Course
	err := s.db.QueryRowContext(ctx, query, courseID).Scan(
		&c.ID, &c.Title, &c.Description, &c.Category, &c.Icon, &c.Level,
		&c.IsPublished, &c.CreatedBy, &c.CreatedAt, &c.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get course: %w", err)
	}
	return &c, nil
}

// ─── Уроки ────────────────────────────────────────────────────────────────────

func (s *Store) GetLessons(ctx context.Context, courseID, userID string) ([]models.Lesson, error) {
	query := `
		SELECT
			l.id, l.course_id, l.title, l.content, l.order_index,
			l.created_at, l.updated_at,
			(lp.lesson_id IS NOT NULL) AS is_completed
		FROM lessons l
		LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $2
		WHERE l.course_id = $1
		ORDER BY l.order_index ASC
	`
	rows, err := s.db.QueryContext(ctx, query, courseID, userID)
	if err != nil {
		return nil, fmt.Errorf("get lessons: %w", err)
	}
	defer rows.Close()

	var lessons []models.Lesson
	for rows.Next() {
		var l models.Lesson
		if err := rows.Scan(
			&l.ID, &l.CourseID, &l.Title, &l.Content, &l.OrderIndex,
			&l.CreatedAt, &l.UpdatedAt, &l.IsCompleted,
		); err != nil {
			return nil, fmt.Errorf("scan lesson: %w", err)
		}
		lessons = append(lessons, l)
	}
	return lessons, rows.Err()
}

// ─── Прогресс ─────────────────────────────────────────────────────────────────

func (s *Store) CompleteLesson(ctx context.Context, userID, lessonID string) error {
	query := `
		INSERT INTO lesson_progress (user_id, lesson_id, completed_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (user_id, lesson_id) DO NOTHING
	`
	_, err := s.db.ExecContext(ctx, query, userID, lessonID)
	return err
}

// ─── Квизы ────────────────────────────────────────────────────────────────────

func (s *Store) GetQuiz(ctx context.Context, courseID string) (*models.Quiz, error) {
	var quiz models.Quiz
	err := s.db.QueryRowContext(ctx,
		`SELECT id, course_id, title FROM quizzes WHERE course_id = $1`, courseID,
	).Scan(&quiz.ID, &quiz.CourseID, &quiz.Title)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get quiz: %w", err)
	}

	rows, err := s.db.QueryContext(ctx,
		`SELECT id, quiz_id, text, order_index FROM quiz_questions WHERE quiz_id = $1 ORDER BY order_index`,
		quiz.ID,
	)
	if err != nil {
		return nil, fmt.Errorf("get questions: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var q models.QuizQuestion
		if err := rows.Scan(&q.ID, &q.QuizID, &q.Text, &q.OrderIndex); err != nil {
			return nil, err
		}

		optRows, err := s.db.QueryContext(ctx,
			`SELECT id, question_id, text FROM quiz_options WHERE question_id = $1 ORDER BY id`,
			q.ID,
		)
		if err != nil {
			return nil, fmt.Errorf("get options: %w", err)
		}
		for optRows.Next() {
			var o models.QuizOption
			if err := optRows.Scan(&o.ID, &o.QuestionID, &o.Text); err != nil {
				optRows.Close()
				return nil, err
			}
			q.Options = append(q.Options, o)
		}
		optRows.Close()
		quiz.Questions = append(quiz.Questions, q)
	}

	return &quiz, rows.Err()
}

func (s *Store) SubmitQuiz(ctx context.Context, userID, quizID string, answers []models.QuizAnswer) (*models.QuizResult, error) {
	correct := 0
	total := len(answers)

	for _, ans := range answers {
		var isCorrect bool
		err := s.db.QueryRowContext(ctx,
			`SELECT is_correct FROM quiz_options WHERE id = $1 AND question_id = $2`,
			ans.OptionID, ans.QuestionID,
		).Scan(&isCorrect)
		if err != nil {
			continue
		}
		if isCorrect {
			correct++
		}
	}

	passed := false
	percent := 0
	if total > 0 {
		percent = correct * 100 / total
		passed = percent >= 70
	}

	message := "Попробуйте ещё раз — у вас всё получится! 💪"
	if passed {
		message = "Отлично! Вы успешно прошли квиз 🎉"
	}

	_, err := s.db.ExecContext(ctx,
		`INSERT INTO quiz_attempts (id, user_id, quiz_id, score, total, passed, completed_at)
		 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())`,
		userID, quizID, correct, total, passed,
	)
	if err != nil {
		return nil, fmt.Errorf("save quiz attempt: %w", err)
	}

	return &models.QuizResult{
		Score:   correct,
		Total:   total,
		Passed:  passed,
		Percent: percent,
		Message: message,
	}, nil
}

func (s *Store) GetBestQuizAttempt(ctx context.Context, userID, quizID string) (*models.QuizAttempt, error) {
	var a models.QuizAttempt
	err := s.db.QueryRowContext(ctx,
		`SELECT id, user_id, quiz_id, score, total, passed, completed_at
		 FROM quiz_attempts WHERE user_id = $1 AND quiz_id = $2
		 ORDER BY score DESC LIMIT 1`,
		userID, quizID,
	).Scan(&a.ID, &a.UserID, &a.QuizID, &a.Score, &a.Total, &a.Passed, &a.CompletedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &a, nil
}

// ─── Admin ────────────────────────────────────────────────────────────────────

func (s *Store) CreateCourse(ctx context.Context, req models.CreateCourseRequest, adminID string) (*models.Course, error) {
	var c models.Course
	err := s.db.QueryRowContext(ctx,
		`INSERT INTO courses (id, title, description, category, icon, level, is_published, created_by, created_at, updated_at)
		 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, false, $6::uuid, NOW(), NOW())
		 RETURNING id, title, description, category, icon, level, is_published,
		           COALESCE(created_by::text, '') as created_by, created_at, updated_at`,
		req.Title, req.Description, req.Category, req.Icon, req.Level, adminID,
	).Scan(
		&c.ID, &c.Title, &c.Description, &c.Category, &c.Icon, &c.Level,
		&c.IsPublished, &c.CreatedBy, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("create course: %w", err)
	}
	return &c, nil
}

func (s *Store) UpdateCourse(ctx context.Context, courseID string, req models.UpdateCourseRequest) (*models.Course, error) {
	setClauses := "updated_at = NOW()"
	args := []interface{}{}
	argIdx := 1

	if req.Title != nil {
		setClauses += fmt.Sprintf(", title = $%d", argIdx)
		args = append(args, *req.Title)
		argIdx++
	}
	if req.Description != nil {
		setClauses += fmt.Sprintf(", description = $%d", argIdx)
		args = append(args, *req.Description)
		argIdx++
	}
	if req.Category != nil {
		setClauses += fmt.Sprintf(", category = $%d", argIdx)
		args = append(args, *req.Category)
		argIdx++
	}
	if req.Icon != nil {
		setClauses += fmt.Sprintf(", icon = $%d", argIdx)
		args = append(args, *req.Icon)
		argIdx++
	}
	if req.Level != nil {
		setClauses += fmt.Sprintf(", level = $%d", argIdx)
		args = append(args, *req.Level)
		argIdx++
	}
	if req.IsPublished != nil {
		setClauses += fmt.Sprintf(", is_published = $%d", argIdx)
		args = append(args, *req.IsPublished)
		argIdx++
	}

	args = append(args, courseID)
	query := fmt.Sprintf(
		`UPDATE courses SET %s WHERE id = $%d
		 RETURNING id, title, description, category, icon, level, is_published,
		           COALESCE(created_by::text, '') as created_by, created_at, updated_at`,
		setClauses, argIdx,
	)

	var c models.Course
	err := s.db.QueryRowContext(ctx, query, args...).Scan(
		&c.ID, &c.Title, &c.Description, &c.Category, &c.Icon, &c.Level,
		&c.IsPublished, &c.CreatedBy, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("update course: %w", err)
	}
	return &c, nil
}

func (s *Store) CreateLesson(ctx context.Context, req models.CreateLessonRequest) (*models.Lesson, error) {
	var l models.Lesson
	err := s.db.QueryRowContext(ctx,
		`INSERT INTO lessons (id, course_id, title, content, order_index, created_at, updated_at)
		 VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
		 RETURNING id, course_id, title, content, order_index, created_at, updated_at`,
		req.CourseID, req.Title, req.Content, req.OrderIndex,
	).Scan(&l.ID, &l.CourseID, &l.Title, &l.Content, &l.OrderIndex, &l.CreatedAt, &l.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create lesson: %w", err)
	}
	return &l, nil
}

func (s *Store) CreateQuiz(ctx context.Context, req models.CreateQuizRequest) (*models.Quiz, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var quiz models.Quiz
	err = tx.QueryRowContext(ctx,
		`INSERT INTO quizzes (id, course_id, title) VALUES (gen_random_uuid(), $1, $2)
		 RETURNING id, course_id, title`,
		req.CourseID, req.Title,
	).Scan(&quiz.ID, &quiz.CourseID, &quiz.Title)
	if err != nil {
		return nil, fmt.Errorf("create quiz: %w", err)
	}

	for _, qReq := range req.Questions {
		var question models.QuizQuestion
		err = tx.QueryRowContext(ctx,
			`INSERT INTO quiz_questions (id, quiz_id, text, order_index)
			 VALUES (gen_random_uuid(), $1, $2, $3)
			 RETURNING id, quiz_id, text, order_index`,
			quiz.ID, qReq.Text, qReq.OrderIndex,
		).Scan(&question.ID, &question.QuizID, &question.Text, &question.OrderIndex)
		if err != nil {
			return nil, fmt.Errorf("create question: %w", err)
		}

		for _, oReq := range qReq.Options {
			var opt models.QuizOption
			err = tx.QueryRowContext(ctx,
				`INSERT INTO quiz_options (id, question_id, text, is_correct)
				 VALUES (gen_random_uuid(), $1, $2, $3)
				 RETURNING id, question_id, text`,
				question.ID, oReq.Text, oReq.IsCorrect,
			).Scan(&opt.ID, &opt.QuestionID, &opt.Text)
			if err != nil {
				return nil, fmt.Errorf("create option: %w", err)
			}
			question.Options = append(question.Options, opt)
		}
		quiz.Questions = append(quiz.Questions, question)
	}

	return &quiz, tx.Commit()
}
