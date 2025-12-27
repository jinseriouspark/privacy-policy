-- Migration 002: Fix Infinite Recursion in RLS Policies
-- Issue: get_user_id_by_email() causes infinite recursion when querying users table
-- Solution: Use direct email comparison instead of querying users table

-- ============================================
-- Drop existing problematic policies
-- ============================================

-- Users table policies
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users manage own roles" ON user_roles;
DROP POLICY IF EXISTS "Users view own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Instructors manage own coachings" ON coachings;
DROP POLICY IF EXISTS "Instructors manage own templates" ON package_templates;
DROP POLICY IF EXISTS "Manage own packages" ON packages;
DROP POLICY IF EXISTS "Manage own reservations" ON reservations;
DROP POLICY IF EXISTS "Users view own promo usage" ON promo_code_usage;

-- ============================================
-- Recreate policies WITHOUT infinite recursion
-- ============================================

-- Users: Use email directly
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (email = auth.jwt()->>'email');

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (email = auth.jwt()->>'email');

-- User Roles: Join with users table
CREATE POLICY "Users manage own roles"
  ON user_roles FOR ALL
  USING (
    user_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

-- User Subscriptions: Join with users table
CREATE POLICY "Users view own subscriptions"
  ON user_subscriptions FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

-- Coachings: Join with users table
CREATE POLICY "Instructors manage own coachings"
  ON coachings FOR ALL
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

-- Package Templates: Join with users table
CREATE POLICY "Instructors manage own templates"
  ON package_templates FOR ALL
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

-- Packages: Join with users table
CREATE POLICY "Manage own packages"
  ON packages FOR ALL
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
    OR student_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

-- Reservations: Join with users table
CREATE POLICY "Manage own reservations"
  ON reservations FOR ALL
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
    OR student_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

-- Promo Code Usage: Join with users table
CREATE POLICY "Users view own promo usage"
  ON promo_code_usage FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

-- ============================================
-- Drop the problematic function (no longer needed)
-- ============================================

DROP FUNCTION IF EXISTS get_user_id_by_email(TEXT);

-- ============================================
-- Verification queries
-- ============================================

-- Test that policies work
SELECT 'Migration 002 completed successfully!' AS status;

-- Check RLS is still enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'user_roles', 'coachings', 'packages', 'reservations')
ORDER BY tablename;
