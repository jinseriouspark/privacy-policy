-- Add type column to coachings table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coachings' AND column_name = 'type'
  ) THEN
    ALTER TABLE coachings ADD COLUMN type TEXT DEFAULT 'private' CHECK (type IN ('private', 'group'));
  END IF;
END $$;

-- Update existing rows to have 'private' as default
UPDATE coachings SET type = 'private' WHERE type IS NULL;
