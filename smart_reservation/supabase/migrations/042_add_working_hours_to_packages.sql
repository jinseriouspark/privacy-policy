-- ============================================================================
-- Migration 042: Add working_hours to packages table
-- ============================================================================
-- Purpose: Allow per-package time slot customization
-- Strategy: Hierarchical configuration (coaching default → package override)
-- DBA Pattern: Configuration inheritance / Cascading settings
-- ============================================================================

-- Add working_hours column to packages
-- NULL means "use coaching's working_hours"
-- Non-NULL means "override with package-specific hours"
ALTER TABLE packages
ADD COLUMN working_hours JSONB DEFAULT NULL;

-- Add index for JSONB queries (optional, for future filtering)
CREATE INDEX idx_packages_working_hours ON packages USING GIN (working_hours);

-- Add helpful comment
COMMENT ON COLUMN packages.working_hours IS
  'Package-specific working hours (overrides coaching.working_hours if set).
   Format: {"monday": {"enabled": true, "blocks": [{"start": "09:00", "end": "18:00"}]}, ...}
   NULL = use coaching default';

-- ============================================================================
-- Example Usage:
-- ============================================================================
--
-- Case 1: Normal package (uses coaching time)
-- UPDATE packages SET working_hours = NULL WHERE id = 1;
-- → Uses coaching.working_hours
--
-- Case 2: VIP weekend-only package
-- UPDATE packages SET working_hours = '{
--   "monday": {"enabled": false, "blocks": []},
--   "tuesday": {"enabled": false, "blocks": []},
--   "wednesday": {"enabled": false, "blocks": []},
--   "thursday": {"enabled": false, "blocks": []},
--   "friday": {"enabled": false, "blocks": []},
--   "saturday": {"enabled": true, "blocks": [{"start": "10:00", "end": "14:00"}]},
--   "sunday": {"enabled": true, "blocks": [{"start": "10:00", "end": "14:00"}]}
-- }'::jsonb WHERE id = 2;
-- → Overrides coaching hours
--
-- Case 3: Corporate lunch-only package
-- UPDATE packages SET working_hours = '{
--   "monday": {"enabled": true, "blocks": [{"start": "12:00", "end": "14:00"}]},
--   "tuesday": {"enabled": true, "blocks": [{"start": "12:00", "end": "14:00"}]},
--   "wednesday": {"enabled": true, "blocks": [{"start": "12:00", "end": "14:00"}]},
--   "thursday": {"enabled": true, "blocks": [{"start": "12:00", "end": "14:00"}]},
--   "friday": {"enabled": true, "blocks": [{"start": "12:00", "end": "14:00"}]},
--   "saturday": {"enabled": false, "blocks": []},
--   "sunday": {"enabled": false, "blocks": []}
-- }'::jsonb WHERE id = 3;
-- → Overrides coaching hours
--
-- ============================================================================
-- Query pattern for application:
-- ============================================================================
--
-- SELECT
--   p.id,
--   p.name,
--   COALESCE(p.working_hours, c.working_hours) as effective_working_hours
-- FROM packages p
-- JOIN coachings c ON p.coaching_id = c.id
-- WHERE p.id = ?
--
-- This uses package hours if set, otherwise falls back to coaching hours.
-- ============================================================================
