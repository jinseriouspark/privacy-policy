-- Remove deprecated username column from users table
-- username has been replaced by short_id

-- Drop the unique index on username first
DROP INDEX IF EXISTS idx_users_username;

-- Remove the username column
ALTER TABLE users DROP COLUMN IF EXISTS username;

-- Verify short_id exists and is unique
DO $$
BEGIN
  -- Check if short_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'short_id'
  ) THEN
    RAISE EXCEPTION 'short_id column does not exist in users table';
  END IF;

  -- Check if short_id unique constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'users'
    AND constraint_type = 'UNIQUE'
    AND constraint_name LIKE '%short_id%'
  ) THEN
    -- Add unique constraint if it doesn't exist
    ALTER TABLE users ADD CONSTRAINT users_short_id_key UNIQUE (short_id);
  END IF;
END $$;

-- Ensure short_id is not null for existing users
UPDATE users SET short_id = LOWER(REGEXP_REPLACE(name, '[^a-z0-9]+', '-', 'g'))
WHERE short_id IS NULL OR short_id = '';

-- Add comment
COMMENT ON COLUMN users.short_id IS '10-char ID for URLs (replaces deprecated username)';
