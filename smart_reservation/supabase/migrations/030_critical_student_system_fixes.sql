-- ============================================================================
-- Migration: Critical Student System Fixes
-- Date: 2025-12-26
-- Description: Security, data integrity, and performance improvements
-- Based on: DBA_REVIEW.md recommendations
-- ============================================================================

-- ============================================================================
-- PHASE 1: ADD TIMEZONE SUPPORT
-- ============================================================================

-- Add timezone column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Seoul';

COMMENT ON COLUMN users.timezone IS 'User timezone for correct time display (e.g., Asia/Seoul, UTC)';

-- ============================================================================
-- PHASE 2: CREATE ENUM TYPES
-- ============================================================================

-- Reservation status enum
DO $$ BEGIN
  CREATE TYPE reservation_status AS ENUM (
    'pending',
    'confirmed',
    'cancelled',
    'completed',
    'no_show'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Attendance status enum
DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM (
    'present',
    'absent',
    'late',
    'excused'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PHASE 3: CREATE/UPDATE TABLES
-- ============================================================================

-- Create reservations table if not exists
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id),
  instructor_id UUID REFERENCES users(id),
  coaching_id UUID REFERENCES coachings(id),
  package_id UUID REFERENCES student_packages(id),

  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,

  status reservation_status DEFAULT 'confirmed',
  meet_link TEXT,
  attendance_status attendance_status,

  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,

  idempotency_key VARCHAR(255) UNIQUE,
  deleted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  -- Constraints
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Add version column for optimistic locking
ALTER TABLE student_packages
ADD COLUMN IF NOT EXISTS version INT DEFAULT 0;

-- ============================================================================
-- PHASE 4: PREVENT DOUBLE-BOOKING
-- ============================================================================

-- Enable btree_gist extension for exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Drop existing constraint if it exists
DO $$ BEGIN
  ALTER TABLE reservations DROP CONSTRAINT IF EXISTS no_instructor_overlap;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add exclusion constraint to prevent overlapping reservations
ALTER TABLE reservations
ADD CONSTRAINT no_instructor_overlap
EXCLUDE USING GIST (
  instructor_id WITH =,
  tstzrange(start_time, end_time) WITH &&
) WHERE (status NOT IN ('cancelled', 'no_show') AND deleted_at IS NULL);

COMMENT ON CONSTRAINT no_instructor_overlap ON reservations IS
  'Prevents double-booking: instructor cannot have overlapping reservations';

-- ============================================================================
-- PHASE 5: CASCADE DELETE RULES
-- ============================================================================

-- Update foreign key constraints for reservations
ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_student_id_fkey,
  ADD CONSTRAINT reservations_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES users(id)
    ON DELETE CASCADE;

ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_instructor_id_fkey,
  ADD CONSTRAINT reservations_instructor_id_fkey
    FOREIGN KEY (instructor_id) REFERENCES users(id)
    ON DELETE SET NULL;

ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_coaching_id_fkey,
  ADD CONSTRAINT reservations_coaching_id_fkey
    FOREIGN KEY (coaching_id) REFERENCES coachings(id)
    ON DELETE SET NULL;

ALTER TABLE reservations
  DROP CONSTRAINT IF EXISTS reservations_package_id_fkey,
  ADD CONSTRAINT reservations_package_id_fkey
    FOREIGN KEY (package_id) REFERENCES student_packages(id)
    ON DELETE SET NULL;

-- ============================================================================
-- PHASE 6: CREATE ESSENTIAL INDEXES
-- ============================================================================

-- Reservations indexes
CREATE INDEX IF NOT EXISTS idx_reservations_student_id ON reservations(student_id);
CREATE INDEX IF NOT EXISTS idx_reservations_instructor_id ON reservations(instructor_id);
CREATE INDEX IF NOT EXISTS idx_reservations_coaching_id ON reservations(coaching_id);

CREATE INDEX IF NOT EXISTS idx_reservations_student_date ON reservations(
  student_id,
  start_time
) WHERE status NOT IN ('cancelled') AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_instructor_time ON reservations(
  instructor_id,
  start_time,
  end_time
) WHERE status NOT IN ('cancelled', 'no_show') AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_active ON reservations(student_id)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_idempotency ON reservations(idempotency_key);

-- Student packages indexes
CREATE INDEX IF NOT EXISTS idx_student_packages_student_id ON student_packages(student_id);
CREATE INDEX IF NOT EXISTS idx_student_packages_valid ON student_packages(
  student_id,
  valid_until
) WHERE status = 'active' AND credits_remaining > 0;

-- ============================================================================
-- PHASE 7: AUTO-UPDATE TRIGGERS
-- ============================================================================

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to reservations
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Apply to student_packages
DROP TRIGGER IF EXISTS update_student_packages_updated_at ON student_packages;
CREATE TRIGGER update_student_packages_updated_at
BEFORE UPDATE ON student_packages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PHASE 8: PACKAGE VALIDATION TRIGGER
-- ============================================================================

-- Function to validate package before booking
CREATE OR REPLACE FUNCTION check_package_validity()
RETURNS TRIGGER AS $$
DECLARE
  pkg RECORD;
BEGIN
  -- Get package details
  SELECT * INTO pkg
  FROM student_packages
  WHERE id = NEW.package_id;

  -- Check if package exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Package not found: %', NEW.package_id;
  END IF;

  -- Check if package has credits
  IF pkg.credits_remaining < 1 THEN
    RAISE EXCEPTION 'Package has no remaining credits';
  END IF;

  -- Check if package is active
  IF pkg.status != 'active' THEN
    RAISE EXCEPTION 'Package is not active (status: %)', pkg.status;
  END IF;

  -- Check if package is expired
  IF pkg.valid_until < NEW.start_time THEN
    RAISE EXCEPTION 'Package expired on %', pkg.valid_until;
  END IF;

  -- Check if booking is within valid_from date
  IF pkg.valid_from > NEW.start_time THEN
    RAISE EXCEPTION 'Package not yet valid (starts: %)', pkg.valid_from;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS validate_package_before_reservation ON reservations;
CREATE TRIGGER validate_package_before_reservation
BEFORE INSERT ON reservations
FOR EACH ROW
EXECUTE FUNCTION check_package_validity();

-- ============================================================================
-- PHASE 9: AUTO-GENERATE MEET LINK
-- ============================================================================

-- Function to generate meet link
CREATE OR REPLACE FUNCTION generate_meet_link()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.meet_link IS NULL OR NEW.meet_link = '' THEN
    -- Generate a meet link based on reservation ID
    NEW.meet_link = 'https://meet.yeyak-mania.vercel.app/' || NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS auto_generate_meet_link ON reservations;
CREATE TRIGGER auto_generate_meet_link
BEFORE INSERT ON reservations
FOR EACH ROW
EXECUTE FUNCTION generate_meet_link();

-- ============================================================================
-- PHASE 10: SET CREATED_BY ON INSERT
-- ============================================================================

-- Function to set created_by
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS set_reservation_created_by ON reservations;
CREATE TRIGGER set_reservation_created_by
BEFORE INSERT ON reservations
FOR EACH ROW
EXECUTE FUNCTION set_created_by();

-- ============================================================================
-- PHASE 11: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on reservations
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Students can view their own reservations" ON reservations;
DROP POLICY IF EXISTS "Instructors can view their assigned reservations" ON reservations;
DROP POLICY IF EXISTS "Students can create reservations" ON reservations;
DROP POLICY IF EXISTS "Students can cancel their own reservations" ON reservations;
DROP POLICY IF EXISTS "Instructors can update their reservations" ON reservations;

-- Students can view their own reservations
CREATE POLICY "Students can view their own reservations"
  ON reservations FOR SELECT
  USING (
    auth.uid() = student_id
    AND deleted_at IS NULL
  );

-- Instructors can view their assigned reservations
CREATE POLICY "Instructors can view their assigned reservations"
  ON reservations FOR SELECT
  USING (
    auth.uid() = instructor_id
    AND deleted_at IS NULL
  );

-- Students can create reservations
CREATE POLICY "Students can create reservations"
  ON reservations FOR INSERT
  WITH CHECK (
    auth.uid() = student_id
  );

-- Students can cancel their own reservations
CREATE POLICY "Students can cancel their own reservations"
  ON reservations FOR UPDATE
  USING (
    auth.uid() = student_id
  )
  WITH CHECK (
    auth.uid() = student_id
    AND OLD.student_id = NEW.student_id
    AND OLD.instructor_id = NEW.instructor_id
    AND OLD.start_time = NEW.start_time
  );

-- Instructors can update attendance
CREATE POLICY "Instructors can update their reservations"
  ON reservations FOR UPDATE
  USING (
    auth.uid() = instructor_id
  )
  WITH CHECK (
    auth.uid() = instructor_id
    AND OLD.instructor_id = NEW.instructor_id
  );

-- Enable RLS on student_packages
ALTER TABLE student_packages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Students can view their own packages" ON student_packages;
DROP POLICY IF EXISTS "Instructors can view packages for their students" ON student_packages;
DROP POLICY IF EXISTS "Instructors can manage student packages" ON student_packages;

-- Students can view their own packages
CREATE POLICY "Students can view their own packages"
  ON student_packages FOR SELECT
  USING (
    auth.uid()::text = student_id::text
  );

-- Instructors can view packages for their students
CREATE POLICY "Instructors can view packages for their students"
  ON student_packages FOR SELECT
  USING (
    auth.uid()::text = instructor_id::text
  );

-- Instructors can manage student packages
CREATE POLICY "Instructors can manage student packages"
  ON student_packages FOR ALL
  USING (
    auth.uid()::text = instructor_id::text
  );

-- ============================================================================
-- PHASE 12: HELPER FUNCTIONS
-- ============================================================================

-- Function to get available time slots
CREATE OR REPLACE FUNCTION get_available_slots(
  p_instructor_id UUID,
  p_date DATE,
  p_interval INTERVAL DEFAULT '30 minutes'
) RETURNS TABLE(time_slot TIMESTAMPTZ, is_available BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  WITH time_grid AS (
    SELECT generate_series(
      (p_date || ' 00:00:00')::TIMESTAMPTZ,
      (p_date || ' 23:59:59')::TIMESTAMPTZ,
      p_interval
    ) AS slot
  )
  SELECT
    tg.slot,
    NOT EXISTS (
      SELECT 1
      FROM reservations r
      WHERE r.instructor_id = p_instructor_id
        AND r.start_time <= tg.slot
        AND r.end_time > tg.slot
        AND r.status NOT IN ('cancelled', 'no_show')
        AND r.deleted_at IS NULL
    ) AS is_available
  FROM time_grid tg;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_available_slots IS
  'Returns time slots and their availability for an instructor on a given date';

-- ============================================================================
-- PHASE 13: GRANT PERMISSIONS
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON reservations TO authenticated;
GRANT SELECT, UPDATE ON student_packages TO authenticated;

-- Grant usage on functions
GRANT EXECUTE ON FUNCTION get_available_slots TO authenticated;
GRANT EXECUTE ON FUNCTION check_package_validity TO authenticated;
GRANT EXECUTE ON FUNCTION generate_meet_link TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add migration metadata
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 030 completed successfully';
  RAISE NOTICE '   - Added timezone support';
  RAISE NOTICE '   - Created ENUM types for status fields';
  RAISE NOTICE '   - Prevented double-booking with exclusion constraint';
  RAISE NOTICE '   - Added optimistic locking to packages';
  RAISE NOTICE '   - Set up cascade delete rules';
  RAISE NOTICE '   - Created essential indexes';
  RAISE NOTICE '   - Added auto-update triggers';
  RAISE NOTICE '   - Implemented package validation';
  RAISE NOTICE '   - Enabled Row Level Security';
  RAISE NOTICE '   - Created helper functions';
END $$;
