-- ============================================================================
-- Migration 020: Add Composite Indexes for Performance
-- ============================================================================
-- Purpose: Add composite indexes to improve query performance
-- Breaking Change: NO - pure performance improvement
-- ============================================================================

BEGIN;

-- ============================================================================
-- RESERVATIONS TABLE INDEXES
-- ============================================================================

-- Index for coaching-specific time queries (most common query pattern)
-- Used when checking availability for a specific coaching
CREATE INDEX IF NOT EXISTS idx_reservations_coaching_time
  ON reservations(coaching_id, start_time, end_time)
  WHERE status IN ('confirmed', 'pending');

COMMENT ON INDEX idx_reservations_coaching_time IS
  'Optimizes availability queries for specific coaching by filtering confirmed/pending reservations.';

-- Index for instructor-specific attendance tracking
CREATE INDEX IF NOT EXISTS idx_reservations_attendance_instructor
  ON reservations(instructor_id, attendance_status, start_time DESC);

COMMENT ON INDEX idx_reservations_attendance_instructor IS
  'Optimizes attendance tracking queries, showing recent sessions first.';

-- ============================================================================
-- PACKAGES TABLE INDEXES
-- ============================================================================

-- Index for student-instructor-coaching package lookups
CREATE INDEX IF NOT EXISTS idx_packages_student_instructor_coaching
  ON packages(student_id, instructor_id, coaching_id);

COMMENT ON INDEX idx_packages_student_instructor_coaching IS
  'Optimizes package lookup when student books a specific coaching.';

-- Index for finding expiring packages
CREATE INDEX IF NOT EXISTS idx_packages_expiring
  ON packages(instructor_id, expires_at)
  WHERE expires_at IS NOT NULL AND remaining_sessions > 0;

COMMENT ON INDEX idx_packages_expiring IS
  'Optimizes queries for packages that are about to expire with remaining sessions.';

-- ============================================================================
-- INVITATIONS TABLE INDEXES
-- ============================================================================

-- Index for coaching-specific pending invitations
CREATE INDEX IF NOT EXISTS idx_invitations_coaching_status
  ON invitations(coaching_id, status)
  WHERE status = 'pending';

COMMENT ON INDEX idx_invitations_coaching_status IS
  'Optimizes lookup of pending invitations for a specific coaching.';

-- Index for instructor invitation management
CREATE INDEX IF NOT EXISTS idx_invitations_instructor_status
  ON invitations(instructor_id, status, created_at DESC);

COMMENT ON INDEX idx_invitations_instructor_status IS
  'Optimizes instructor dashboard showing recent invitations.';

-- ============================================================================
-- ACTIVITY_LOGS TABLE INDEXES
-- ============================================================================

-- Index for user activity analytics
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_action
  ON activity_logs(user_id, action, created_at DESC);

COMMENT ON INDEX idx_activity_logs_user_action IS
  'Optimizes user behavior analysis and activity history queries.';

-- Index for tab-specific analytics
CREATE INDEX IF NOT EXISTS idx_activity_logs_tab_date
  ON activity_logs(tab_name, created_at DESC)
  WHERE tab_name IS NOT NULL;

COMMENT ON INDEX idx_activity_logs_tab_date IS
  'Optimizes analytics queries for specific dashboard tabs.';

-- ============================================================================
-- SETTINGS TABLE INDEXES
-- ============================================================================

-- GIN index for JSONB business_hours queries
CREATE INDEX IF NOT EXISTS idx_settings_business_hours
  ON settings USING GIN (business_hours);

COMMENT ON INDEX idx_settings_business_hours IS
  'Optimizes JSONB queries on business_hours configuration.';

-- ============================================================================
-- STUDENT_INSTRUCTORS TABLE INDEXES
-- ============================================================================

-- Additional coaching index (already has student and instructor indexes)
-- This one was added in migration 018, but ensuring it exists
CREATE INDEX IF NOT EXISTS idx_student_instructors_coaching
  ON student_instructors(coaching_id);

COMMENT ON INDEX idx_student_instructors_coaching IS
  'Optimizes queries for all students of a specific coaching.';

-- ============================================================================
-- GROUP_CLASSES TABLE INDEXES
-- ============================================================================

-- Index for upcoming group classes
CREATE INDEX IF NOT EXISTS idx_group_classes_upcoming
  ON group_classes(instructor_id, date, time)
  WHERE status = 'scheduled';

COMMENT ON INDEX idx_group_classes_upcoming IS
  'Optimizes queries for upcoming scheduled group classes.';

-- ============================================================================
-- LOG INDEX CREATION RESULTS
-- ============================================================================

DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public';

  RAISE NOTICE '=== Composite Indexes Added ===';
  RAISE NOTICE 'Total indexes in public schema: %', index_count;
  RAISE NOTICE 'Reservations: coaching_time, attendance_instructor';
  RAISE NOTICE 'Packages: student_instructor_coaching, expiring';
  RAISE NOTICE 'Invitations: coaching_status, instructor_status';
  RAISE NOTICE 'Activity Logs: user_action, tab_date';
  RAISE NOTICE 'Settings: business_hours (GIN)';
  RAISE NOTICE 'Group Classes: upcoming';
END $$;

COMMIT;
