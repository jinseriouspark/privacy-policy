-- Add package_ids column to invitations table
-- This allows instructors to pre-select packages when inviting students

ALTER TABLE invitations
ADD COLUMN IF NOT EXISTS package_ids TEXT[] DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN invitations.package_ids IS 'Array of package template IDs to auto-assign when student accepts invitation';
