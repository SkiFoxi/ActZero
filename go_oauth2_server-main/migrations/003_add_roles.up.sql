-- Инициализация базы данных
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Создание дополнительных индексов для производительности
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_clients_domain ON clients(domain);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- Вставка тестовых данных для разработки.
-- Пароли реально соответствуют bcrypt-хешам ниже (cost=10).
-- Если хотите сменить пароль — сгенерируйте новый хеш, например:
--   htpasswd -bnBC 10 "" "новый_пароль" | tr -d ':\n'
--   или в Go: bcrypt.GenerateFromPassword([]byte("новый_пароль"), 10)

INSERT INTO users (id, username, password, created_at)
VALUES (
           uuid_generate_v4(),
           'admin',
           '$2a$10$Kot84wkRFfpuoKUhrQe02.W5qXgFwJTQVVmG3rgBTIuvUHaon6/6q', -- password: admin
           NOW()
       ) ON CONFLICT (username) DO UPDATE
           SET password = EXCLUDED.password;

INSERT INTO users (id, username, password, created_at)
VALUES (
           uuid_generate_v4(),
           'developer',
           '$2a$10$baNcGD.MqNFPNIALtySNSulGiBQ5ovQIJpoLaKiIpkV2ipaQ6tXcu', -- password: developer
           NOW()
       ) ON CONFLICT (username) DO UPDATE
           SET password = EXCLUDED.password;
