-- ============================================================================
-- Migration 017: Move calendar_id from settings to coachings
-- ============================================================================
-- Purpose: Allow each coaching to have its own Google Calendar
-- Breaking Change: NO - calendar_id column already exists in coachings
-- Rollback: Keep settings.calendar_id for backwards compatibility
-- ============================================================================

BEGIN;

-- Step 1: Verify calendar_id column exists in coachings (should already exist)
-- If not, add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coachings' AND column_name = 'calendar_id'
  ) THEN
    ALTER TABLE coachings ADD COLUMN calendar_id TEXT;
  END IF;
END $$;

-- Step 2: Create index for calendar_id (if not exists)
CREATE INDEX IF NOT EXISTS idx_coachings_calendar_id
  ON coachings(calendar_id);

-- Step 3: Migrate existing calendar_id from settings to ALL coachings
-- This copies the instructor's single calendar to all their coachings
UPDATE coachings c
SET calendar_id = s.calendar_id
FROM settings s
WHERE c.instructor_id = s.instructor_id
  AND s.calendar_id IS NOT NULL
  AND c.calendar_id IS NULL;

-- Step 4: Add comment
COMMENT ON COLUMN coachings.calendar_id IS
  'Google Calendar ID for this specific coaching. Allows instructors to have separate calendars for different coaching types (e.g., Pilates, Yoga).';

-- Step 5: Log migration status
DO $$
DECLARE
  total_coachings INTEGER;
  coachings_with_calendar INTEGER;
  coachings_without_calendar INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_coachings FROM coachings;
  SELECT COUNT(*) INTO coachings_with_calendar FROM coachings WHERE calendar_id IS NOT NULL;
  SELECT COUNT(*) INTO coachings_without_calendar FROM coachings WHERE calendar_id IS NULL;

  RAISE NOTICE '=== Calendar Migration Stats ===';
  RAISE NOTICE 'Total coachings: %', total_coachings;
  RAISE NOTICE 'Coachings with calendar: %', coachings_with_calendar;
  RAISE NOTICE 'Coachings without calendar: %', coachings_without_calendar;
END $$;

-- ============================================================================
-- IMPORTANT: DO NOT DROP settings.calendar_id YET
-- ============================================================================
-- Keep settings.calendar_id for backwards compatibility during transition
-- Consider dropping it in a future migration after confirming all code updated
-- ============================================================================

COMMIT;
