-- Revert RLS policies to use standard Supabase Auth
-- Now that we're creating proper Supabase Auth sessions, we can use auth.jwt()

-- ============================================
-- COACHINGS TABLE
-- ============================================

DROP POLICY IF EXISTS "Instructors manage own coachings" ON coachings;
DROP POLICY IF EXISTS "Anyone can view active coachings" ON coachings;

-- Allow instructors to manage their own coachings
CREATE POLICY "Instructors manage own coachings"
  ON coachings FOR ALL
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  )
  WITH CHECK (
    instructor_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

-- Anyone can view active coachings
CREATE POLICY "Anyone can view active coachings"
  ON coachings FOR SELECT
  USING (status = 'active');

-- ============================================
-- USERS TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (email = auth.jwt()->>'email')
  WITH CHECK (email = auth.jwt()->>'email');

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (email = auth.jwt()->>'email');

COMMENT ON POLICY "Instructors manage own coachings" ON coachings IS 'Uses Supabase Auth JWT (created via Google OAuth)';
COMMENT ON POLICY "Users can update own profile" ON users IS 'Uses Supabase Auth JWT (created via Google OAuth)';
COMMENT ON POLICY "Users can view own profile" ON users IS 'Uses Supabase Auth JWT (created via Google OAuth)';
