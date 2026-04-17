-- Добавляем поля профиля пользователя
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS full_name        VARCHAR(255),
    ADD COLUMN IF NOT EXISTS phone            VARCHAR(50),
    ADD COLUMN IF NOT EXISTS email_verified   BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) NOT NULL DEFAULT 'free',
    ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW();

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
