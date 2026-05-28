-- Таблица курсов
CREATE TABLE IF NOT EXISTS courses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category    VARCHAR(100) NOT NULL DEFAULT '',
    icon        VARCHAR(10)  NOT NULL DEFAULT '📚',
    level       VARCHAR(50)  NOT NULL DEFAULT 'beginner',
    is_published BOOLEAN     NOT NULL DEFAULT FALSE,
    created_by  UUID,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица уроков
CREATE TABLE IF NOT EXISTS lessons (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    content     TEXT NOT NULL DEFAULT '',
    order_index INT  NOT NULL DEFAULT 0,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Прогресс пользователя по урокам
CREATE TABLE IF NOT EXISTS lesson_progress (
    user_id      TEXT NOT NULL,
    lesson_id    UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, lesson_id)
);

-- Квизы
CREATE TABLE IF NOT EXISTS quizzes (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title     VARCHAR(255) NOT NULL
);

-- Вопросы квиза
CREATE TABLE IF NOT EXISTS quiz_questions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id     UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    order_index INT  NOT NULL DEFAULT 0
);

-- Варианты ответов
CREATE TABLE IF NOT EXISTS quiz_options (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID    NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    text        TEXT    NOT NULL,
    is_correct  BOOLEAN NOT NULL DEFAULT FALSE
);

-- Попытки прохождения квиза
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      TEXT NOT NULL,
    quiz_id      UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    score        INT  NOT NULL DEFAULT 0,
    total        INT  NOT NULL DEFAULT 0,
    passed       BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрых запросов
CREATE INDEX IF NOT EXISTS idx_lessons_course_id       ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz  ON quiz_attempts(user_id, quiz_id);
