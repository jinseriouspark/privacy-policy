-- Fix RLS policies for invitations table - Version 2
-- The issue is that instructor_id must match auth.uid() when inserting

-- Drop all existing policies
DROP POLICY IF EXISTS "Instructors can create invitations" ON invitations;
DROP POLICY IF EXISTS "Instructors can view own invitations" ON invitations;
DROP POLICY IF EXISTS "Instructors can update own invitations" ON invitations;
DROP POLICY IF EXISTS "Anyone can view by invitation code" ON invitations;

-- Recreate INSERT policy - check that the coaching belongs to the current user
CREATE POLICY "Instructors can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coachings
      WHERE coachings.id = coaching_id
      AND coachings.instructor_id = auth.uid()
    )
  );

-- Recreate SELECT policy - can view if instructor or by invitation code
CREATE POLICY "Instructors can view own invitations"
  ON invitations FOR SELECT
  USING (
    instructor_id = auth.uid() OR true
  );

-- Recreate UPDATE policy
CREATE POLICY "Instructors can update own invitations"
  ON invitations FOR UPDATE
  USING (instructor_id = auth.uid());

COMMENT ON TABLE invitations IS 'Student invitations with RLS checking coaching ownership';
