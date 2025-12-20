-- Drop existing type column and constraint if they exist
ALTER TABLE coachings DROP COLUMN IF EXISTS type CASCADE;

-- Add type column with proper constraint
ALTER TABLE coachings ADD COLUMN type TEXT NOT NULL DEFAULT 'private';

-- Add constraint
ALTER TABLE coachings ADD CONSTRAINT coachings_type_check CHECK (type IN ('private', 'group'));
