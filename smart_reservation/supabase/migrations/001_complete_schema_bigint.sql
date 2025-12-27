-- Migration 001: Complete Schema with BIGINT
-- 깔끔한 스키마 (안 쓰는 테이블 제거 + RLS 정책 수정)
-- ⚠️ WARNING: 기존 데이터가 있으면 모두 삭제됩니다!

-- ============================================
-- 기존 테이블 전부 삭제
-- ============================================
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS group_classes CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS student_instructors CASCADE;
DROP TABLE IF EXISTS subscription_usage CASCADE;
DROP TABLE IF EXISTS promo_email_whitelist CASCADE;
DROP TABLE IF EXISTS promo_code_usage CASCADE;
DROP TABLE IF EXISTS promo_codes CASCADE;
DROP TABLE IF EXISTS package_templates CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS coachings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- 1. Users 테이블
-- ============================================
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  picture TEXT,
  bio TEXT,
  phone TEXT,

  -- Studio 정보 (강사용)
  studio_name TEXT,
  studio_url TEXT UNIQUE,

  -- Flags
  lifetime_access BOOLEAN NOT NULL DEFAULT false,
  lifetime_access_note TEXT,
  is_profile_complete BOOLEAN DEFAULT false,

  -- 메타데이터
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_studio_url ON users(studio_url);
CREATE INDEX idx_users_lifetime_access ON users(lifetime_access);

-- ============================================
-- 2. User Roles 테이블
-- ============================================
CREATE TABLE user_roles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('instructor', 'student')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- ============================================
-- 3. Subscription Plans 테이블
-- ============================================
CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  monthly_price INTEGER NOT NULL DEFAULT 0,
  yearly_price INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO subscription_plans (id, name, display_name, description, monthly_price, yearly_price, features, limits) VALUES
('free', 'free', 'Free', '개인 강사를 위한 시작 플랜', 0, 0,
 '{"private_reservations": true, "group_classes": true, "attendance_check": true, "statistics": true}'::jsonb,
 '{"max_students": 10, "max_coachings": 1}'::jsonb),
('standard', 'standard', 'Standard', '성장하는 강사를 위한 필수 플랜', 19000, 190000,
 '{"private_reservations": true, "group_classes": true, "attendance_check": true, "statistics": true, "priority_support": true}'::jsonb,
 '{"max_students": 500, "max_coachings": 5}'::jsonb),
('teams', 'teams', 'Teams', '준비 중', 0, 0,
 '{"coming_soon": true}'::jsonb, '{}'::jsonb),
('enterprise', 'enterprise', 'Enterprise', '준비 중', 0, 0,
 '{"coming_soon": true}'::jsonb, '{}'::jsonb);

-- ============================================
-- 4. User Subscriptions 테이블
-- ============================================
CREATE TABLE user_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')) DEFAULT 'monthly',
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')) DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, status)
);

CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);

-- ============================================
-- 5. Coachings 테이블
-- ============================================
CREATE TABLE coachings (
  id BIGSERIAL PRIMARY KEY,
  instructor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  type TEXT NOT NULL DEFAULT 'private' CHECK (type IN ('private', 'group')),
  duration INTEGER NOT NULL DEFAULT 60,
  price INTEGER DEFAULT 0,

  google_calendar_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coachings_instructor ON coachings(instructor_id);
CREATE INDEX idx_coachings_slug ON coachings(slug);
CREATE INDEX idx_coachings_status ON coachings(status);

-- ============================================
-- 6. Package Templates 테이블
-- ============================================
CREATE TABLE package_templates (
  id BIGSERIAL PRIMARY KEY,
  coaching_id BIGINT NOT NULL REFERENCES coachings(id) ON DELETE CASCADE,
  instructor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  total_sessions INTEGER,
  validity_days INTEGER NOT NULL,
  price INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('session_based', 'time_based', 'unlimited')) DEFAULT 'session_based',

  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_package_templates_coaching ON package_templates(coaching_id);
CREATE INDEX idx_package_templates_instructor ON package_templates(instructor_id);

-- ============================================
-- 7. Packages 테이블
-- ============================================
CREATE TABLE packages (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instructor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coaching_id BIGINT REFERENCES coachings(id) ON DELETE SET NULL,
  package_template_id BIGINT REFERENCES package_templates(id) ON DELETE SET NULL,

  name TEXT,
  total_sessions INTEGER NOT NULL,
  remaining_sessions INTEGER NOT NULL,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_packages_student ON packages(student_id);
CREATE INDEX idx_packages_instructor ON packages(instructor_id);
CREATE INDEX idx_packages_coaching ON packages(coaching_id);

-- ============================================
-- 8. Reservations 테이블
-- ============================================
CREATE TABLE reservations (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instructor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coaching_id BIGINT REFERENCES coachings(id) ON DELETE SET NULL,
  package_id BIGINT REFERENCES packages(id) ON DELETE SET NULL,

  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'confirmed',
  attendance_status TEXT CHECK (attendance_status IN ('pending', 'attended', 'absent', 'late')),

  google_event_id TEXT,
  meet_link TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reservations_student ON reservations(student_id);
CREATE INDEX idx_reservations_instructor ON reservations(instructor_id);
CREATE INDEX idx_reservations_start_time ON reservations(start_time);
CREATE INDEX idx_reservations_status ON reservations(status);

-- ============================================
-- 9. Promo Codes 테이블
-- ============================================
CREATE TABLE promo_codes (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value INTEGER NOT NULL,
  plan_id TEXT REFERENCES subscription_plans(id),
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_active ON promo_codes(is_active);

INSERT INTO promo_codes (code, description, discount_type, discount_value, plan_id, valid_until) VALUES
('MASTERMIND2025', '마스터마인드 할인', 'fixed_amount', 9000, 'standard', '2025-12-31 23:59:59+09'),
('EARLYBIRD', '얼리버드 50%', 'percentage', 50, 'standard', '2025-03-31 23:59:59+09'),
('FRIENDS', '지인 초대 30%', 'percentage', 30, 'standard', NULL);

-- ============================================
-- 10. Promo Code Usage 테이블
-- ============================================
CREATE TABLE promo_code_usage (
  id BIGSERIAL PRIMARY KEY,
  promo_code_id BIGINT NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id BIGINT REFERENCES user_subscriptions(id),
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(promo_code_id, user_id)
);

CREATE INDEX idx_promo_code_usage_user ON promo_code_usage(user_id);
CREATE INDEX idx_promo_code_usage_code ON promo_code_usage(promo_code_id);

-- ============================================
-- 11. Promo Email Whitelist 테이블
-- ============================================
CREATE TABLE promo_email_whitelist (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  promo_code_id BIGINT REFERENCES promo_codes(id) ON DELETE SET NULL,
  auto_apply BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_promo_email_whitelist_email ON promo_email_whitelist(email);

-- ============================================
-- Helper Functions
-- ============================================

-- updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coachings_updated_at BEFORE UPDATE ON coachings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_package_templates_updated_at BEFORE UPDATE ON package_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 사용자 역할 관련 함수
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id BIGINT)
RETURNS TEXT[] AS $$
  SELECT ARRAY_AGG(role) FROM user_roles WHERE user_id = p_user_id;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION has_role(p_user_id BIGINT, p_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = p_role);
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_primary_role(p_user_id BIGINT)
RETURNS TEXT AS $$
  SELECT CASE
    WHEN has_role(p_user_id, 'instructor') THEN 'instructor'
    WHEN has_role(p_user_id, 'student') THEN 'student'
    ELSE NULL
  END;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- Users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (email = auth.jwt()->>'email');

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (email = auth.jwt()->>'email');

-- User Roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own roles"
  ON user_roles FOR ALL
  USING (
    user_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

-- Subscription Plans (모두 조회 가능)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans FOR SELECT
  USING (true);

-- User Subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscriptions"
  ON user_subscriptions FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

-- Coachings
ALTER TABLE coachings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors manage own coachings"
  ON coachings FOR ALL
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Anyone can view active coachings"
  ON coachings FOR SELECT
  USING (status = 'active');

-- Package Templates
ALTER TABLE package_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors manage own templates"
  ON package_templates FOR ALL
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Anyone can view active templates"
  ON package_templates FOR SELECT
  USING (is_active = true);

-- Packages
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

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

-- Reservations
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

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

-- Promo Codes
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promo codes"
  ON promo_codes FOR SELECT
  USING (is_active = true);

-- Promo Code Usage
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own promo usage"
  ON promo_code_usage FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

-- Promo Email Whitelist
ALTER TABLE promo_email_whitelist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view whitelist"
  ON promo_email_whitelist FOR SELECT
  USING (true);

-- ============================================
-- 검증 쿼리
-- ============================================

-- 모든 테이블 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- RLS 활성화 확인
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- 완료
-- ============================================
-- ✅ UUID → BIGINT 전환 완료
-- ✅ 안 쓰는 테이블 제거 (activity_logs, group_classes, invitations, settings, student_instructors, subscription_usage)
-- ✅ RLS 정책 수정 (auth.jwt()->>'email' 사용)
-- ✅ Helper 함수 추가 (get_user_id_by_email)
