-- Migration 024: User Roles System
-- 한 사용자가 여러 역할(instructor, student)을 가질 수 있도록 변경
-- 예: 요가 강사가 필라테스 수업을 듣는 경우

-- ============================================
-- 1. user_roles 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('instructor', 'student')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 한 사용자가 같은 역할을 중복으로 가질 수 없음
  UNIQUE(user_id, role)
);

-- ============================================
-- 2. 인덱스 생성 (성능 최적화)
-- ============================================
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- 복합 인덱스 (특정 역할을 가진 사용자 빠르게 찾기)
CREATE INDEX idx_user_roles_lookup ON user_roles(role, user_id);

-- ============================================
-- 3. 기존 데이터 마이그레이션
-- ============================================

-- user_type이 있는 사용자들의 역할 추가
INSERT INTO user_roles (user_id, role)
SELECT id, user_type
FROM users
WHERE user_type IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;  -- 중복 방지

-- 강사는 자동으로 학생 역할도 가짐 (다른 강사 수업 들을 수 있음)
INSERT INTO user_roles (user_id, role)
SELECT id, 'student'
FROM users
WHERE user_type = 'instructor'
ON CONFLICT (user_id, role) DO NOTHING;

-- user_type이 NULL인 신규 사용자는 아무 역할 없음 (온보딩 필요)

-- ============================================
-- 4. Helper Functions (편의 함수)
-- ============================================

-- 사용자의 모든 역할 조회
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id UUID)
RETURNS TEXT[] AS $$
  SELECT ARRAY_AGG(role)
  FROM user_roles
  WHERE user_id = p_user_id;
$$ LANGUAGE SQL STABLE;

-- 사용자가 특정 역할을 가지고 있는지 확인
CREATE OR REPLACE FUNCTION has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id AND role = p_role
  );
$$ LANGUAGE SQL STABLE;

-- 사용자의 주 역할 (Primary Role) 결정
-- instructor 역할이 있으면 instructor, 아니면 student
CREATE OR REPLACE FUNCTION get_primary_role(p_user_id UUID)
RETURNS TEXT AS $$
  SELECT CASE
    WHEN has_role(p_user_id, 'instructor') THEN 'instructor'
    WHEN has_role(p_user_id, 'student') THEN 'student'
    ELSE NULL
  END;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- 5. RLS (Row Level Security) 정책
-- ============================================

-- user_roles 테이블에 RLS 활성화
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 역할만 조회 가능
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 역할을 추가할 수 없음 (서버에서만 가능)
-- 관리자만 역할 추가/삭제 가능 (나중에 추가)

-- ============================================
-- 6. 주석 (Documentation)
-- ============================================

COMMENT ON TABLE user_roles IS '사용자 역할 테이블: 한 사용자가 여러 역할(instructor, student)을 가질 수 있음';
COMMENT ON COLUMN user_roles.user_id IS '사용자 ID (users 테이블 참조)';
COMMENT ON COLUMN user_roles.role IS '역할: instructor (강사) 또는 student (학생)';
COMMENT ON COLUMN user_roles.created_at IS '역할 부여 일시';

COMMENT ON FUNCTION get_user_roles(UUID) IS '사용자의 모든 역할을 배열로 반환';
COMMENT ON FUNCTION has_role(UUID, TEXT) IS '사용자가 특정 역할을 가지고 있는지 확인';
COMMENT ON FUNCTION get_primary_role(UUID) IS '사용자의 주 역할 반환 (instructor 우선)';

-- ============================================
-- 7. 검증 쿼리 (Migration 성공 확인용)
-- ============================================

-- 강사이면서 학생인 사용자 수
SELECT COUNT(DISTINCT user_id) as dual_role_users
FROM user_roles
WHERE user_id IN (
  SELECT user_id FROM user_roles WHERE role = 'instructor'
  INTERSECT
  SELECT user_id FROM user_roles WHERE role = 'student'
);

-- 역할 분포
SELECT role, COUNT(*) as count
FROM user_roles
GROUP BY role;
