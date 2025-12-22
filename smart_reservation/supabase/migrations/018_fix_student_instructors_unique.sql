-- ============================================================================
-- Migration 018: Fix student_instructors Unique Constraint
-- ============================================================================
-- Purpose: Allow students to have multiple coachings from same instructor
-- Breaking Change: YES - changes unique constraint
-- Issue: Current UNIQUE(student_id, instructor_id) prevents multiple coachings
-- Fix: Change to UNIQUE(student_id, instructor_id, coaching_id)
-- ============================================================================

BEGIN;

-- Step 1: Make coaching_id NOT NULL (required for proper multi-coaching support)
-- First, check if there are any NULL coaching_id rows
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM student_instructors
  WHERE coaching_id IS NULL;

  IF null_count > 0 THEN
    RAISE NOTICE 'Found % rows with NULL coaching_id - these need manual cleanup', null_count;
    RAISE EXCEPTION 'Cannot proceed: % rows have NULL coaching_id. Please fix data first.', null_count;
  END IF;
END $$;

-- Step 2: Drop old unique constraint
ALTER TABLE student_instructors
  DROP CONSTRAINT IF EXISTS unique_student_instructor;

-- Step 3: Add new unique constraint
-- This allows same student to have multiple coachings from same instructor
ALTER TABLE student_instructors
  ADD CONSTRAINT unique_student_instructor_coaching
  UNIQUE(student_id, instructor_id, coaching_id);

-- Step 4: Make coaching_id NOT NULL
ALTER TABLE student_instructors
  ALTER COLUMN coaching_id SET NOT NULL;

-- Step 5: Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_student_instructors_coaching
  ON student_instructors(coaching_id);

-- Step 6: Add comment
COMMENT ON CONSTRAINT unique_student_instructor_coaching ON student_instructors IS
  'Ensures a student can only be linked to a specific coaching once, but can have multiple coachings from the same instructor.';

-- Step 7: Log migration status
DO $$
DECLARE
  total_relationships INTEGER;
  unique_students INTEGER;
  unique_instructors INTEGER;
  unique_coachings INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_relationships FROM student_instructors;
  SELECT COUNT(DISTINCT student_id) INTO unique_students FROM student_instructors;
  SELECT COUNT(DISTINCT instructor_id) INTO unique_instructors FROM student_instructors;
  SELECT COUNT(DISTINCT coaching_id) INTO unique_coachings FROM student_instructors;

  RAISE NOTICE '=== Student-Instructor Relationship Stats ===';
  RAISE NOTICE 'Total relationships: %', total_relationships;
  RAISE NOTICE 'Unique students: %', unique_students;
  RAISE NOTICE 'Unique instructors: %', unique_instructors;
  RAISE NOTICE 'Unique coachings: %', unique_coachings;
END $$;

COMMIT;
