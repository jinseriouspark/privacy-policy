-- Migration 001: Fix RLS Policies for Supabase Auth
-- auth.email()이 작동하지 않는 문제 해결

-- ============================================
-- 기존 정책 삭제
-- ============================================
DROP POLICY IF EXISTS "Users manage own data" ON users;
DROP POLICY IF EXISTS "Instructors manage own coachings" ON coachings;
DROP POLICY IF EXISTS "Anyone can view active coachings" ON coachings;
DROP POLICY IF EXISTS "Manage own packages" ON packages;
DROP POLICY IF EXISTS "Manage own reservations" ON reservations;
DROP POLICY IF EXISTS "Anyone can view active promo codes" ON promo_codes;

-- ============================================
-- 새로운 정책 (auth.uid() 사용)
-- ============================================

-- Users: 로그인한 사용자는 모든 사용자 조회 가능, 본인만 수정 가능
CREATE POLICY "Authenticated users can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id IN (SELECT id FROM users WHERE email = auth.jwt()->>'email'));

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (email = auth.jwt()->>'email');

-- User Roles: 본인 역할만 관리
CREATE POLICY "Users manage own roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE email = auth.jwt()->>'email'));

-- Coachings: 강사는 자신의 코칭 관리, 모두 조회 가능
CREATE POLICY "Instructors manage own coachings"
  ON coachings FOR ALL
  TO authenticated
  USING (instructor_id IN (SELECT id FROM users WHERE email = auth.jwt()->>'email'));

CREATE POLICY "Anyone can view active coachings"
  ON coachings FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Packages: 강사는 자신이 발급한 수강권, 학생은 자신의 수강권
CREATE POLICY "Manage own packages"
  ON packages FOR ALL
  TO authenticated
  USING (
    instructor_id IN (SELECT id FROM users WHERE email = auth.jwt()->>'email')
    OR student_id IN (SELECT id FROM users WHERE email = auth.jwt()->>'email')
  );

-- Reservations: 강사는 자신의 예약, 학생은 자신의 예약
CREATE POLICY "Manage own reservations"
  ON reservations FOR ALL
  TO authenticated
  USING (
    instructor_id IN (SELECT id FROM users WHERE email = auth.jwt()->>'email')
    OR student_id IN (SELECT id FROM users WHERE email = auth.jwt()->>'email')
  );

-- Package Templates: 강사는 자신의 템플릿 관리, 모두 조회 가능
CREATE POLICY "Instructors manage own templates"
  ON package_templates FOR ALL
  TO authenticated
  USING (instructor_id IN (SELECT id FROM users WHERE email = auth.jwt()->>'email'));

CREATE POLICY "Anyone can view active templates"
  ON package_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Promo Codes: 모두 조회 가능
CREATE POLICY "Anyone can view active promo codes"
  ON promo_codes FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Promo Code Usage: 본인 사용 내역만 조회
CREATE POLICY "Users view own promo usage"
  ON promo_code_usage FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE email = auth.jwt()->>'email'));

-- Subscription Plans: 모두 조회 가능
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (true);

-- User Subscriptions: 본인 구독만 조회
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE email = auth.jwt()->>'email'));

-- ============================================
-- 완료
-- ============================================
