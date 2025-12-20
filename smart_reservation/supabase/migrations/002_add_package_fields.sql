-- Add package-specific fields to coachings table
ALTER TABLE coachings ADD COLUMN IF NOT EXISTS credits INTEGER;
ALTER TABLE coachings ADD COLUMN IF NOT EXISTS valid_days INTEGER;

-- Add type field to distinguish between coaching types
ALTER TABLE coachings ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('individual', 'group', 'package')) DEFAULT 'individual';

-- Update existing records
UPDATE coachings SET type = 'individual' WHERE type IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_coachings_type ON coachings(type);
