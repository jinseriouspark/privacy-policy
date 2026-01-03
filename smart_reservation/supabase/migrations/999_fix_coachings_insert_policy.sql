-- Fix coachings RLS policy to allow INSERT
-- The existing policy has USING clause but no WITH CHECK clause for INSERT

DROP POLICY IF EXISTS "Instructors manage own coachings" ON coachings;

CREATE POLICY "Instructors manage own coachings"
  ON coachings FOR ALL
  USING (
    -- Allow SELECT/UPDATE/DELETE if user owns the coaching
    instructor_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  )
  WITH CHECK (
    -- Allow INSERT if user is creating coaching with their own instructor_id
    instructor_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );
