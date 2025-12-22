-- Add short_id column to users table for shorter, user-friendly IDs
-- UUIDs remain for internal use and Supabase Auth compatibility

-- Add short_id column
ALTER TABLE users ADD COLUMN IF NOT EXISTS short_id TEXT UNIQUE;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_short_id ON users(short_id);

-- Function to generate 10-character alphanumeric ID
CREATE OR REPLACE FUNCTION generate_short_id()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..10 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Populate existing users with short_ids
DO $$
DECLARE
  user_record RECORD;
  new_short_id TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER;
BEGIN
  FOR user_record IN SELECT id FROM users WHERE short_id IS NULL LOOP
    attempt := 0;
    LOOP
      new_short_id := generate_short_id();

      -- Check if this short_id already exists
      IF NOT EXISTS (SELECT 1 FROM users WHERE short_id = new_short_id) THEN
        UPDATE users SET short_id = new_short_id WHERE id = user_record.id;
        EXIT;
      END IF;

      attempt := attempt + 1;
      IF attempt >= max_attempts THEN
        RAISE EXCEPTION 'Failed to generate unique short_id after % attempts', max_attempts;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Make short_id NOT NULL after populating
ALTER TABLE users ALTER COLUMN short_id SET NOT NULL;

-- Add trigger to auto-generate short_id for new users
CREATE OR REPLACE FUNCTION auto_generate_short_id()
RETURNS TRIGGER AS $$
DECLARE
  new_short_id TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  IF NEW.short_id IS NULL THEN
    LOOP
      new_short_id := generate_short_id();

      -- Check if this short_id already exists
      IF NOT EXISTS (SELECT 1 FROM users WHERE short_id = new_short_id) THEN
        NEW.short_id := new_short_id;
        EXIT;
      END IF;

      attempt := attempt + 1;
      IF attempt >= max_attempts THEN
        RAISE EXCEPTION 'Failed to generate unique short_id after % attempts', max_attempts;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_short_id ON users;
CREATE TRIGGER trigger_auto_generate_short_id
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_short_id();

COMMENT ON COLUMN users.short_id IS 'Short 10-character alphanumeric ID for user-friendly URLs and sharing';
