-- Migration: Fix RLS Policies using email matching
-- Purpose: Correct RLS policies to match current user structure
-- Date: 2025-12-26

-- =====================================================
-- FIX PACKAGES RLS POLICIES (email-based)
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Students can view their own packages" ON packages;
DROP POLICY IF EXISTS "Instructors can view packages for their students" ON packages;
DROP POLICY IF EXISTS "Instructors can manage student packages" ON packages;

-- Students can view their own packages (all packages including expired)
CREATE POLICY "Students can view their own packages"
  ON packages FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM users WHERE email = auth.email()
    )
    AND deleted_at IS NULL
  );

-- Instructors can view packages for their students
CREATE POLICY "Instructors can view packages for their students"
  ON packages FOR SELECT
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE email = auth.email()
    )
  );

-- Instructors can manage student packages
CREATE POLICY "Instructors can manage student packages"
  ON packages FOR ALL
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE email = auth.email()
    )
  );

-- =====================================================
-- FIX RESERVATIONS RLS POLICIES (email-based)
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Students can view their own reservations" ON reservations;
DROP POLICY IF EXISTS "Instructors can view their reservations" ON reservations;
DROP POLICY IF EXISTS "Students can create reservations" ON reservations;
DROP POLICY IF EXISTS "Instructors can manage their reservations" ON reservations;
DROP POLICY IF EXISTS "Students can cancel their own reservations" ON reservations;

-- Students can view their own reservations
CREATE POLICY "Students can view their own reservations"
  ON reservations FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM users WHERE email = auth.email()
    )
  );

-- Instructors can view their reservations
CREATE POLICY "Instructors can view their reservations"
  ON reservations FOR SELECT
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE email = auth.email()
    )
  );

-- Students can create reservations (with package validation)
CREATE POLICY "Students can create reservations"
  ON reservations FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM users WHERE email = auth.email()
    )
    AND package_id IN (
      SELECT id FROM packages
      WHERE student_id IN (
        SELECT id FROM users WHERE email = auth.email()
      )
      AND coaching_id = NEW.coaching_id
      AND (valid_from IS NULL OR CURRENT_DATE >= valid_from::date)
      AND (valid_until IS NULL OR CURRENT_DATE <= valid_until::date)
      AND credits_remaining > 0
      AND deleted_at IS NULL
    )
  );

-- Instructors can manage their reservations
CREATE POLICY "Instructors can manage their reservations"
  ON reservations FOR ALL
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE email = auth.email()
    )
  );

-- Students can cancel their own reservations
CREATE POLICY "Students can cancel their own reservations"
  ON reservations FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM users WHERE email = auth.email()
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT id FROM users WHERE email = auth.email()
    )
  );

-- =====================================================
-- FIX NOTIFICATIONS RLS POLICIES (if exists)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Students can view their own notifications" ON notifications;
    DROP POLICY IF EXISTS "Students can update their own notifications" ON notifications;
    DROP POLICY IF EXISTS "Students can soft-delete their own notifications" ON notifications;

    -- Students can view their own notifications
    CREATE POLICY "Students can view their own notifications"
      ON notifications FOR SELECT
      USING (
        user_id IN (
          SELECT id FROM users WHERE email = auth.email()
        )
      );

    -- Students can update their own notifications
    CREATE POLICY "Students can update their own notifications"
      ON notifications FOR UPDATE
      USING (
        user_id IN (
          SELECT id FROM users WHERE email = auth.email()
        )
      )
      WITH CHECK (
        user_id IN (
          SELECT id FROM users WHERE email = auth.email()
        )
      );

    -- Students can soft-delete their own notifications
    CREATE POLICY "Students can soft-delete their own notifications"
      ON notifications FOR UPDATE
      USING (
        user_id IN (
          SELECT id FROM users WHERE email = auth.email()
        )
      )
      WITH CHECK (
        user_id IN (
          SELECT id FROM users WHERE email = auth.email()
        )
      );
  END IF;
END $$;

COMMENT ON POLICY "Students can view their own packages" ON packages IS 'Allows students to view all their packages (including expired) by matching auth.email() with users.email';
COMMENT ON POLICY "Students can view their own reservations" ON reservations IS 'Allows students to view their reservations by matching auth.email() with users.email';
COMMENT ON POLICY "Students can create reservations" ON reservations IS 'Allows students to create reservations only with valid packages (matching coaching_id, within validity period, and with remaining credits)';
