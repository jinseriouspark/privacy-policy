-- Ensure invitations table has coaching_id column
-- This migration safely adds the column if it doesn't exist

-- Add coaching_id column if not exists
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS coaching_id UUID REFERENCES coachings(id) ON DELETE CASCADE;

-- Drop old constraint if exists
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS unique_instructor_email;

-- Add new constraint for coaching_id + email uniqueness
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS unique_coaching_email;
ALTER TABLE invitations ADD CONSTRAINT unique_coaching_email UNIQUE(coaching_id, email);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_coaching ON invitations(coaching_id);

COMMENT ON COLUMN invitations.coaching_id IS 'Reference to the specific coaching/class for this invitation';
