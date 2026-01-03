-- Update RLS policies to use custom auth functions
-- This makes RLS work with our Google OAuth custom JWT system

-- ============================================
-- COACHINGS TABLE
-- ============================================

DROP POLICY IF EXISTS "Instructors manage own coachings" ON coachings;
DROP POLICY IF EXISTS "Authenticated users can manage coachings" ON coachings;
DROP POLICY IF EXISTS "Anyone can view active coachings" ON coachings;

-- Allow instructors to manage their own coachings
CREATE POLICY "Instructors manage own coachings"
  ON coachings FOR ALL
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE email = public.current_user_email()
    )
  )
  WITH CHECK (
    instructor_id IN (
      SELECT id FROM users WHERE email = public.current_user_email()
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

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (email = public.current_user_email())
  WITH CHECK (email = public.current_user_email());

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (email = public.current_user_email());

COMMENT ON POLICY "Instructors manage own coachings" ON coachings IS 'Uses custom JWT headers for authentication';
COMMENT ON POLICY "Users can update own profile" ON users IS 'Uses custom JWT headers for authentication';
COMMENT ON POLICY "Users can view own profile" ON users IS 'Uses custom JWT headers for authentication';
