-- Migration 029: Recreate Coachings Table
-- calendar_id 컬럼 혼란 해결 및 테이블 정리

-- ============================================
-- 1. 기존 coachings 테이블 백업 (데이터 보존)
-- ============================================
CREATE TABLE IF NOT EXISTS coachings_backup AS
SELECT * FROM coachings;

-- ============================================
-- 2. 기존 테이블 삭제 (CASCADE로 관련 제약조건도 삭제)
-- ============================================
DROP TABLE IF EXISTS coachings CASCADE;

-- ============================================
-- 3. coachings 테이블 재생성 (깔끔한 구조)
-- ============================================
CREATE TABLE coachings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 기본 정보
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  -- 타입 및 설정
  type TEXT NOT NULL DEFAULT 'private' CHECK (type IN ('private', 'group')),
  duration INTEGER NOT NULL DEFAULT 60, -- 분
  price INTEGER DEFAULT 0, -- 원

  -- Google Calendar 연동
  google_calendar_id TEXT, -- 이 코칭 전용 캘린더 ID

  -- 상태
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  is_active BOOLEAN DEFAULT true,

  -- 메타데이터
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. 인덱스 생성
-- ============================================
CREATE INDEX idx_coachings_instructor ON coachings(instructor_id);
CREATE INDEX idx_coachings_slug ON coachings(slug);
CREATE INDEX idx_coachings_status ON coachings(status);
CREATE UNIQUE INDEX idx_coachings_slug_unique ON coachings(slug);

-- ============================================
-- 5. 백업 데이터 복원
-- ============================================
INSERT INTO coachings (
  id,
  instructor_id,
  title,
  slug,
  description,
  type,
  duration,
  price,
  google_calendar_id,
  status,
  is_active,
  created_at,
  updated_at
)
SELECT
  id,
  instructor_id,
  title,
  slug,
  description,
  COALESCE(type, 'private'),
  COALESCE(duration, 60),
  COALESCE(price, 0),
  google_calendar_id, -- calendar_id 대신 google_calendar_id 사용
  COALESCE(status, 'active'),
  COALESCE(is_active, true),
  created_at,
  COALESCE(updated_at, NOW())
FROM coachings_backup
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. RLS (Row Level Security) 정책
-- ============================================
ALTER TABLE coachings ENABLE ROW LEVEL SECURITY;

-- 강사는 자신의 코칭만 관리
CREATE POLICY "Instructors manage own coachings"
  ON coachings
  FOR ALL
  USING (auth.uid() = instructor_id);

-- 모든 사람이 활성화된 코칭 조회 가능 (공개 예약 페이지용)
CREATE POLICY "Anyone can view active coachings"
  ON coachings
  FOR SELECT
  USING (status = 'active' AND is_active = true);

-- ============================================
-- 7. 트리거 (updated_at 자동 업데이트)
-- ============================================
DROP TRIGGER IF EXISTS update_coachings_updated_at ON coachings;
CREATE TRIGGER update_coachings_updated_at
  BEFORE UPDATE ON coachings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. 백업 테이블 삭제 (선택)
-- ============================================
-- 복원 완료 후 백업 삭제
DROP TABLE IF EXISTS coachings_backup;

-- ============================================
-- 9. 주석
-- ============================================
COMMENT ON TABLE coachings IS '코칭 클래스 (1:1 또는 그룹)';
COMMENT ON COLUMN coachings.slug IS 'URL용 고유 식별자 (예: piano-lesson)';
COMMENT ON COLUMN coachings.google_calendar_id IS '이 코칭 전용 Google 캘린더 ID';
COMMENT ON COLUMN coachings.type IS 'private (1:1) 또는 group (그룹)';
COMMENT ON COLUMN coachings.status IS 'active (활성) 또는 inactive (비활성)';

-- ============================================
-- 10. 검증 쿼리
-- ============================================

-- 복원된 데이터 확인
SELECT
  COUNT(*) as total_coachings,
  COUNT(CASE WHEN google_calendar_id IS NOT NULL THEN 1 END) as with_calendar,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_coachings
FROM coachings;

-- 강사별 코칭 수
SELECT
  u.email,
  u.name,
  COUNT(c.id) as coaching_count
FROM users u
LEFT JOIN coachings c ON u.id = c.instructor_id
WHERE EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role = 'instructor')
GROUP BY u.id, u.email, u.name
ORDER BY coaching_count DESC;

-- ============================================
-- 완료
-- ============================================
