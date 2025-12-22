-- ============================================================================
-- Migration 019: Add Data Validation Constraints
-- ============================================================================
-- Purpose: Add CHECK constraints to prevent invalid data
-- Breaking Change: NO - only prevents invalid future data
-- ============================================================================

BEGIN;

-- ============================================================================
-- PACKAGES TABLE VALIDATION
-- ============================================================================

-- Constraint: remaining_sessions must be non-negative
ALTER TABLE packages
  ADD CONSTRAINT IF NOT EXISTS chk_remaining_sessions_non_negative
  CHECK (remaining_sessions >= 0);

-- Constraint: remaining_sessions cannot exceed total_sessions
ALTER TABLE packages
  ADD CONSTRAINT IF NOT EXISTS chk_remaining_sessions_valid
  CHECK (remaining_sessions <= total_sessions);

-- Constraint: total_sessions must be positive
ALTER TABLE packages
  ADD CONSTRAINT IF NOT EXISTS chk_total_sessions_positive
  CHECK (total_sessions > 0);

COMMENT ON CONSTRAINT chk_remaining_sessions_non_negative ON packages IS
  'Ensures remaining sessions cannot be negative.';

COMMENT ON CONSTRAINT chk_remaining_sessions_valid ON packages IS
  'Ensures remaining sessions cannot exceed total sessions purchased.';

COMMENT ON CONSTRAINT chk_total_sessions_positive ON packages IS
  'Ensures package must have at least 1 session.';

-- ============================================================================
-- RESERVATIONS TABLE VALIDATION
-- ============================================================================

-- Constraint: end_time must be after start_time
ALTER TABLE reservations
  ADD CONSTRAINT IF NOT EXISTS chk_end_after_start
  CHECK (end_time > start_time);

COMMENT ON CONSTRAINT chk_end_after_start ON reservations IS
  'Ensures reservation end time is after start time.';

-- ============================================================================
-- COACHINGS TABLE VALIDATION
-- ============================================================================

-- Constraint: duration must be positive
ALTER TABLE coachings
  ADD CONSTRAINT IF NOT EXISTS chk_duration_positive
  CHECK (duration > 0);

-- Constraint: price must be non-negative
ALTER TABLE coachings
  ADD CONSTRAINT IF NOT EXISTS chk_price_non_negative
  CHECK (price >= 0);

-- Constraint: credits must be positive (if set)
ALTER TABLE coachings
  ADD CONSTRAINT IF NOT EXISTS chk_credits_positive
  CHECK (credits IS NULL OR credits > 0);

-- Constraint: valid_days must be positive (if set)
ALTER TABLE coachings
  ADD CONSTRAINT IF NOT EXISTS chk_valid_days_positive
  CHECK (valid_days IS NULL OR valid_days > 0);

COMMENT ON CONSTRAINT chk_duration_positive ON coachings IS
  'Ensures coaching duration is at least 1 minute.';

COMMENT ON CONSTRAINT chk_price_non_negative ON coachings IS
  'Ensures coaching price is not negative.';

COMMENT ON CONSTRAINT chk_credits_positive ON coachings IS
  'Ensures coaching credits (if set) is at least 1.';

COMMENT ON CONSTRAINT chk_valid_days_positive ON coachings IS
  'Ensures validity period (if set) is at least 1 day.';

-- ============================================================================
-- GROUP_CLASSES TABLE VALIDATION
-- ============================================================================

-- Constraint: current_count must be non-negative
ALTER TABLE group_classes
  ADD CONSTRAINT IF NOT EXISTS chk_current_count_non_negative
  CHECK (current_count >= 0);

-- Constraint: current_count cannot exceed max_capacity
ALTER TABLE group_classes
  ADD CONSTRAINT IF NOT EXISTS chk_current_count_valid
  CHECK (current_count <= max_capacity);

-- Constraint: max_capacity must be positive
ALTER TABLE group_classes
  ADD CONSTRAINT IF NOT EXISTS chk_max_capacity_positive
  CHECK (max_capacity > 0);

COMMENT ON CONSTRAINT chk_current_count_non_negative ON group_classes IS
  'Ensures current participant count is not negative.';

COMMENT ON CONSTRAINT chk_current_count_valid ON group_classes IS
  'Ensures current count does not exceed maximum capacity.';

COMMENT ON CONSTRAINT chk_max_capacity_positive ON group_classes IS
  'Ensures group class has at least 1 spot available.';

-- ============================================================================
-- LOG VALIDATION RESULTS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== Data Validation Constraints Added ===';
  RAISE NOTICE 'Packages: remaining_sessions, total_sessions validated';
  RAISE NOTICE 'Reservations: end_time > start_time validated';
  RAISE NOTICE 'Coachings: duration, price, credits, valid_days validated';
  RAISE NOTICE 'Group Classes: current_count, max_capacity validated';
END $$;

COMMIT;
