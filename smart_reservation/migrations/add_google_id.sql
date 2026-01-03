-- Add google_id column to users table
-- This is required for direct Google OAuth implementation

ALTER TABLE users
ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Add comment
COMMENT ON COLUMN users.google_id IS 'Google OAuth sub claim - unique identifier from Google';
