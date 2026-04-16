CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username          VARCHAR(255) UNIQUE NOT NULL,
    password          VARCHAR(255) NOT NULL,
    full_name         VARCHAR(255),
    phone             VARCHAR(50),
    email_verified    BOOLEAN NOT NULL DEFAULT FALSE,
    subscription_plan VARCHAR(20) NOT NULL DEFAULT 'free',
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
    id         VARCHAR(255) PRIMARY KEY,
    secret     VARCHAR(255) NOT NULL,
    domain     VARCHAR(255) NOT NULL,
    user_id    VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Триггер: автоматически обновляет updated_at при изменении записи
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

-- Тестовый пользователь (password: P@$$w0rd)
INSERT INTO users (id, username, password, created_at)
VALUES (
    uuid_generate_v4(),
    'testuser',
    '$2a$10$pyrArBhvQOu3W69lPsV8Vu4oGIoWlnBUMqMI9eNfT.LTh5HCbZdwe',
    NOW()
) ON CONFLICT (username) DO NOTHING;