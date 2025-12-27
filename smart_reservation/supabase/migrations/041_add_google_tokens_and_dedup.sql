-- Add Google tokens to users table for calendar integration
ALTER TABLE users
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS google_access_token TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMPTZ DEFAULT NULL;

-- Add comments
COMMENT ON COLUMN users.google_refresh_token IS 'Google OAuth refresh token for calendar access';
COMMENT ON COLUMN users.google_access_token IS 'Google OAuth access token (cached)';
COMMENT ON COLUMN users.google_token_expires_at IS 'Access token expiration timestamp';

-- Remove duplicate users by email (keep the oldest one)
-- First, find duplicates
WITH duplicates AS (
  SELECT
    email,
    MIN(id) as keep_id,
    ARRAY_AGG(id ORDER BY created_at) as all_ids
  FROM users
  WHERE email IS NOT NULL
  GROUP BY email
  HAVING COUNT(*) > 1
),
ids_to_delete AS (
  SELECT UNNEST(all_ids[2:]) as id
  FROM duplicates
)
-- Delete duplicate users (keep the first one created)
DELETE FROM users
WHERE id IN (SELECT id FROM ids_to_delete);

-- Add unique constraint on email
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_email_unique;

ALTER TABLE users
ADD CONSTRAINT users_email_unique UNIQUE (email);
