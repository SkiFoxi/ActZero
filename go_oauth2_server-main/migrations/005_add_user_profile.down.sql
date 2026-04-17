DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
DROP FUNCTION IF EXISTS update_users_updated_at();
ALTER TABLE users
    DROP COLUMN IF EXISTS full_name,
    DROP COLUMN IF EXISTS phone,
    DROP COLUMN IF EXISTS email_verified,
    DROP COLUMN IF EXISTS subscription_plan,
    DROP COLUMN IF EXISTS updated_at;
