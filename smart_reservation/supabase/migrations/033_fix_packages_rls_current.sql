-- Migration: Fix Packages RLS Policies (for existing packages table)
-- Purpose: Correct RLS policies to properly match auth.uid() with user records
-- Date: 2025-12-26

-- =====================================================
-- FIX PACKAGES RLS POLICIES
-- =====================================================

-- Drop existing incorrect policies
DROP POLICY IF EXISTS "Students can view their own packages" ON packages;
DROP POLICY IF EXISTS "Instructors can view packages for their students" ON packages;
DROP POLICY IF EXISTS "Instructors can manage student packages" ON packages;

-- Students can view their own packages (correct version)
CREATE POLICY "Students can view their own packages"
  ON packages FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Instructors can view packages for their students
CREATE POLICY "Instructors can view packages for their students"
  ON packages FOR SELECT
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Instructors can manage student packages (insert, update, delete)
CREATE POLICY "Instructors can manage student packages"
  ON packages FOR ALL
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- =====================================================
-- FIX RESERVATIONS RLS POLICIES
-- =====================================================

-- Drop existing incorrect policies
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
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
    AND deleted_at IS NULL
  );

-- Instructors can view their reservations
CREATE POLICY "Instructors can view their reservations"
  ON reservations FOR SELECT
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
    AND deleted_at IS NULL
  );

-- Students can create reservations
CREATE POLICY "Students can create reservations"
  ON reservations FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Instructors can manage their reservations
CREATE POLICY "Instructors can manage their reservations"
  ON reservations FOR ALL
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Students can cancel their own reservations
CREATE POLICY "Students can cancel their own reservations"
  ON reservations FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  )
  WITH CHECK (
    student_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- =====================================================
-- FIX NOTIFICATIONS RLS POLICIES (if table exists)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    -- Drop existing incorrect policies
    DROP POLICY IF EXISTS "Students can view their own notifications" ON notifications;
    DROP POLICY IF EXISTS "Students can update their own notifications" ON notifications;
    DROP POLICY IF EXISTS "Students can soft-delete their own notifications" ON notifications;

    -- Students can view their own notifications
    CREATE POLICY "Students can view their own notifications"
      ON notifications FOR SELECT
      USING (
        user_id IN (
          SELECT id FROM users WHERE auth_id = auth.uid()
        )
        AND deleted_at IS NULL
      );

    -- Students can update their own notifications (mark as read)
    CREATE POLICY "Students can update their own notifications"
      ON notifications FOR UPDATE
      USING (
        user_id IN (
          SELECT id FROM users WHERE auth_id = auth.uid()
        )
        AND deleted_at IS NULL
      )
      WITH CHECK (
        user_id IN (
          SELECT id FROM users WHERE auth_id = auth.uid()
        )
      );

    -- Students can soft-delete their own notifications
    CREATE POLICY "Students can soft-delete their own notifications"
      ON notifications FOR UPDATE
      USING (
        user_id IN (
          SELECT id FROM users WHERE auth_id = auth.uid()
        )
      )
      WITH CHECK (
        user_id IN (
          SELECT id FROM users WHERE auth_id = auth.uid()
        )
        AND deleted_at IS NOT NULL
      );
  END IF;
END $$;
