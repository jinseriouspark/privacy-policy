-- ============================================================================
-- Migration 021: Fix Coaching Slug Unique Constraint
-- ============================================================================
-- Purpose: Allow multiple instructors to use the same class slug
-- Change: slug UNIQUE → UNIQUE(instructor_id, slug)
-- Example: Both instructor A and B can have "pilates-private" class
-- ============================================================================

BEGIN;

-- Step 1: Drop existing unique constraint on slug
ALTER TABLE coachings
  DROP CONSTRAINT IF EXISTS coachings_slug_key;

-- Step 2: Add composite unique constraint (instructor_id + slug)
-- This ensures each instructor can only have one class with a given slug,
-- but different instructors can use the same slug
ALTER TABLE coachings
  ADD CONSTRAINT coachings_instructor_slug_unique
  UNIQUE(instructor_id, slug);

-- Step 3: Add index for slug queries (since we removed the unique index)
CREATE INDEX IF NOT EXISTS idx_coachings_slug
  ON coachings(slug);

-- Step 4: Add comment
COMMENT ON CONSTRAINT coachings_instructor_slug_unique ON coachings IS
  'Ensures each instructor can only have one class with a given slug, but different instructors can reuse slugs.';

-- Step 5: Verify no duplicate instructor+slug combinations exist
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT instructor_id, slug, COUNT(*) as cnt
    FROM coachings
    GROUP BY instructor_id, slug
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE NOTICE 'WARNING: Found % instructor+slug duplicates. These need manual cleanup.', duplicate_count;
  ELSE
    RAISE NOTICE 'No duplicates found. Migration successful.';
  END IF;
END $$;

-- Step 6: Log migration status
DO $$
DECLARE
  total_coachings INTEGER;
  total_instructors INTEGER;
  total_unique_slugs INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_coachings FROM coachings;
  SELECT COUNT(DISTINCT instructor_id) INTO total_instructors FROM coachings;
  SELECT COUNT(DISTINCT slug) INTO total_unique_slugs FROM coachings;

  RAISE NOTICE '=== Coaching Slug Constraint Updated ===';
  RAISE NOTICE 'Total coachings: %', total_coachings;
  RAISE NOTICE 'Total instructors: %', total_instructors;
  RAISE NOTICE 'Total unique slugs: %', total_unique_slugs;
  RAISE NOTICE 'New constraint: UNIQUE(instructor_id, slug)';
END $$;

COMMIT;
