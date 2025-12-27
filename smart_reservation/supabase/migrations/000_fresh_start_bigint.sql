-- Migration 000: Fresh Start with BIGINT
-- UUID → BIGINT로 전환 (데이터 없을 때만 실행)
-- ⚠️ WARNING: 기존 데이터가 있으면 모두 삭제됩니다!

-- ============================================
-- 기존 테이블 전부 삭제
-- ============================================
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
DROP TABLE IF EXISTS settings CASCADE;
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
  studio_url TEXT UNIQUE, -- 공개 예약 URL용

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
-- 2. User Roles 테이블 (강사 + 학생 동시 가능)
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
  id TEXT PRIMARY KEY, -- 'free', 'standard', 'teams', 'enterprise'
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
  UNIQUE(user_id, status) -- 사용자당 하나의 active 구독만
);

CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);

-- ============================================
-- 5. Coachings 테이블 (깔끔한 구조)
-- ============================================
CREATE TABLE coachings (
  id BIGSERIAL PRIMARY KEY,
  instructor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 기본 정보
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  -- 타입 및 설정
  type TEXT NOT NULL DEFAULT 'private' CHECK (type IN ('private', 'group')),
  duration INTEGER NOT NULL DEFAULT 60,
  price INTEGER DEFAULT 0,

  -- Google Calendar 연동
  google_calendar_id TEXT,

  -- 상태
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),

  -- 메타데이터
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
-- 7. Packages 테이블 (수강권)
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
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coachings ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Users: 본인만 조회/수정
CREATE POLICY "Users manage own data" ON users FOR ALL USING (id = (SELECT id FROM users WHERE email = auth.email()));

-- Coachings: 강사는 자신의 코칭 관리, 모두 조회 가능
CREATE POLICY "Instructors manage own coachings" ON coachings FOR ALL USING (instructor_id = (SELECT id FROM users WHERE email = auth.email()));
CREATE POLICY "Anyone can view active coachings" ON coachings FOR SELECT USING (status = 'active');

-- Packages: 강사는 자신이 발급한 수강권, 학생은 자신의 수강권
CREATE POLICY "Manage own packages" ON packages FOR ALL
  USING (instructor_id = (SELECT id FROM users WHERE email = auth.email()) OR student_id = (SELECT id FROM users WHERE email = auth.email()));

-- Reservations: 강사는 자신의 예약, 학생은 자신의 예약
CREATE POLICY "Manage own reservations" ON reservations FOR ALL
  USING (instructor_id = (SELECT id FROM users WHERE email = auth.email()) OR student_id = (SELECT id FROM users WHERE email = auth.email()));

-- Promo codes: 모두 조회 가능
CREATE POLICY "Anyone can view active promo codes" ON promo_codes FOR SELECT USING (is_active = true);

-- ============================================
-- 완료
-- ============================================
-- 이제 모든 ID가 BIGINT (8 bytes)로 통일되었습니다.
-- UUID (16 bytes) 대비 50% 저장공간 절약
-- 성능도 더 빠름!
