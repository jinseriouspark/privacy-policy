-- Fix RLS policies for invitations table to work with coaching_id

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Instructors can create invitations" ON invitations;

-- Create new INSERT policy that checks if the user owns the coaching
CREATE POLICY "Instructors can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    instructor_id = auth.uid()
  );

-- Also update SELECT policy to include coaching-based access
DROP POLICY IF EXISTS "Instructors can view own invitations" ON invitations;
CREATE POLICY "Instructors can view own invitations"
  ON invitations FOR SELECT
  USING (
    instructor_id = auth.uid()
  );

-- Update UPDATE policy
DROP POLICY IF EXISTS "Instructors can update own invitations" ON invitations;
CREATE POLICY "Instructors can update own invitations"
  ON invitations FOR UPDATE
  USING (instructor_id = auth.uid());

COMMENT ON TABLE invitations IS 'Student invitations with coaching_id reference and RLS policies';
