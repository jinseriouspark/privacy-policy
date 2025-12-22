-- Ensure student_instructors table has coaching_id column
-- This should have been added by migration 010, but ensuring it exists

ALTER TABLE student_instructors ADD COLUMN IF NOT EXISTS coaching_id UUID REFERENCES coachings(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_student_instructors_coaching ON student_instructors(coaching_id);

COMMENT ON COLUMN student_instructors.coaching_id IS 'Links student to specific coaching (optional, for multi-coaching instructors)';
