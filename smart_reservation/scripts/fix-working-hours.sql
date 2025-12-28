-- Quick fix script for working_hours format issue
-- Run this directly in Supabase SQL Editor

-- Check current state (before fix)
SELECT
  id,
  name,
  working_hours
FROM coachings
WHERE working_hours IS NOT NULL
LIMIT 5;

SELECT
  id,
  name,
  working_hours
FROM packages
WHERE working_hours IS NOT NULL
LIMIT 5;

-- Apply the migration
\i supabase/migrations/043_normalize_working_hours_format.sql

-- Check fixed state (after fix)
SELECT
  id,
  name,
  working_hours
FROM coachings
WHERE working_hours IS NOT NULL
LIMIT 5;

SELECT
  id,
  name,
  working_hours
FROM packages
WHERE working_hours IS NOT NULL
LIMIT 5;
