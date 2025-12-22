-- Make user_type nullable to support account type selection flow
ALTER TABLE users ALTER COLUMN user_type DROP NOT NULL;

-- Add comment explaining the flow
COMMENT ON COLUMN users.user_type IS 'User account type: instructor or student. NULL when user first signs up, set after account type selection.';
