-- Migration 028: Package Templates System
-- 한 코칭에 여러 종류의 수강권(템플릿)을 생성할 수 있도록 함
-- 예: "월간 10회권 ₩100,000", "연간 120회권 ₩1,000,000"

-- ============================================
-- 1. 수강권 템플릿 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS package_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coaching_id UUID NOT NULL REFERENCES coachings(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 템플릿 정보
  name TEXT NOT NULL, -- "월간 10회권", "연간 무제한"
  description TEXT,

  -- 수강권 스펙
  total_sessions INTEGER, -- NULL이면 무제한
  validity_days INTEGER NOT NULL, -- 유효기간 (일) - 30일, 365일 등
  price INTEGER NOT NULL, -- 가격 (원)

  -- 타입 (향후 확장용)
  type TEXT NOT NULL CHECK (type IN ('session_based', 'time_based', 'unlimited')) DEFAULT 'session_based',
  -- session_based: 횟수 기반 (10회, 20회)
  -- time_based: 기간 기반 (30일 무제한, 90일 무제한)
  -- unlimited: 무제한

  -- 활성화 여부
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0, -- 표시 순서

  -- 메타데이터
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. 기존 packages 테이블 수정
-- ============================================
-- package_template_id 컬럼 추가 (어떤 템플릿으로 생성되었는지)
ALTER TABLE packages ADD COLUMN IF NOT EXISTS package_template_id UUID REFERENCES package_templates(id) ON DELETE SET NULL;

-- 수강권 이름 추가 (템플릿에서 복사)
ALTER TABLE packages ADD COLUMN IF NOT EXISTS name TEXT;

-- ============================================
-- 3. 인덱스
-- ============================================
CREATE INDEX IF NOT EXISTS idx_package_templates_coaching ON package_templates(coaching_id);
CREATE INDEX IF NOT EXISTS idx_package_templates_instructor ON package_templates(instructor_id);
CREATE INDEX IF NOT EXISTS idx_package_templates_active ON package_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_template ON packages(package_template_id);

-- ============================================
-- 4. 예시 데이터 (필요시 주석 해제)
-- ============================================
-- 예: "피아노 레슨" 코칭에 3가지 수강권 템플릿 생성
/*
INSERT INTO package_templates (coaching_id, instructor_id, name, description, total_sessions, validity_days, price, display_order)
SELECT
  c.id,
  c.instructor_id,
  '체험 3회권',
  '첫 수강생을 위한 체험 패키지',
  3,
  30,
  50000,
  1
FROM coachings c WHERE c.slug = 'piano-lesson'
ON CONFLICT DO NOTHING;

INSERT INTO package_templates (coaching_id, instructor_id, name, description, total_sessions, validity_days, price, display_order)
SELECT
  c.id,
  c.instructor_id,
  '월간 10회권',
  '정기 수강생을 위한 월간 패키지',
  10,
  30,
  150000,
  2
FROM coachings c WHERE c.slug = 'piano-lesson'
ON CONFLICT DO NOTHING;

INSERT INTO package_templates (coaching_id, instructor_id, name, description, total_sessions, validity_days, price, display_order)
SELECT
  c.id,
  c.instructor_id,
  '연간 120회권',
  '장기 수강생 할인 패키지 (10% 할인)',
  120,
  365,
  1620000,
  3
FROM coachings c WHERE c.slug = 'piano-lesson'
ON CONFLICT DO NOTHING;
*/

-- ============================================
-- 5. Helper Functions
-- ============================================

-- 수강권 템플릿으로부터 실제 수강권 생성
CREATE OR REPLACE FUNCTION create_package_from_template(
  p_template_id UUID,
  p_student_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_template package_templates%ROWTYPE;
  v_package_id UUID;
BEGIN
  -- 템플릿 조회
  SELECT * INTO v_template FROM package_templates WHERE id = p_template_id AND is_active = true;

  IF v_template.id IS NULL THEN
    RAISE EXCEPTION 'Template not found or inactive';
  END IF;

  -- 수강권 생성
  INSERT INTO packages (
    student_id,
    instructor_id,
    coaching_id,
    package_template_id,
    name,
    total_sessions,
    remaining_sessions,
    expires_at
  ) VALUES (
    p_student_id,
    v_template.instructor_id,
    v_template.coaching_id,
    v_template.id,
    v_template.name,
    v_template.total_sessions,
    v_template.total_sessions,
    NOW() + INTERVAL '1 day' * v_template.validity_days
  ) RETURNING id INTO v_package_id;

  RETURN v_package_id;
END;
$$ LANGUAGE plpgsql;

-- 코칭의 수강권 템플릿 목록 조회 (활성화된 것만, 순서대로)
CREATE OR REPLACE FUNCTION get_coaching_package_templates(p_coaching_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  total_sessions INTEGER,
  validity_days INTEGER,
  price INTEGER,
  type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pt.id,
    pt.name,
    pt.description,
    pt.total_sessions,
    pt.validity_days,
    pt.price,
    pt.type
  FROM package_templates pt
  WHERE pt.coaching_id = p_coaching_id
    AND pt.is_active = true
  ORDER BY pt.display_order ASC, pt.price ASC;
END;
$$ LANGUAGE plpgsql;

-- 학생의 수강권 목록 조회 (템플릿 정보 포함)
CREATE OR REPLACE FUNCTION get_student_packages_with_templates(p_student_id UUID)
RETURNS TABLE (
  package_id UUID,
  coaching_title TEXT,
  package_name TEXT,
  total_sessions INTEGER,
  remaining_sessions INTEGER,
  expires_at TIMESTAMPTZ,
  instructor_name TEXT,
  is_expired BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    c.title,
    COALESCE(p.name, '수강권'),
    p.total_sessions,
    p.remaining_sessions,
    p.expires_at,
    u.name,
    (p.expires_at IS NOT NULL AND p.expires_at < NOW()) as is_expired
  FROM packages p
  JOIN coachings c ON p.coaching_id = c.id
  JOIN users u ON p.instructor_id = u.id
  WHERE p.student_id = p_student_id
  ORDER BY
    CASE WHEN p.expires_at IS NULL THEN 0 ELSE 1 END, -- 무기한이 먼저
    p.expires_at ASC, -- 만료일 임박한 순
    p.created_at DESC; -- 최신순
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. RLS (Row Level Security)
-- ============================================
ALTER TABLE package_templates ENABLE ROW LEVEL SECURITY;

-- 강사는 자신의 템플릿만 생성/수정/삭제
CREATE POLICY "Instructors manage own templates"
  ON package_templates
  FOR ALL
  USING (auth.uid() = instructor_id);

-- 모든 사용자가 활성화된 템플릿 조회 가능 (수강권 구매를 위해)
CREATE POLICY "Anyone can view active templates"
  ON package_templates
  FOR SELECT
  USING (is_active = true);

-- ============================================
-- 7. 트리거 (updated_at 자동 업데이트)
-- ============================================

-- update_updated_at_column 함수가 없을 경우 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (이미 존재하면 재생성)
DROP TRIGGER IF EXISTS update_package_templates_updated_at ON package_templates;
CREATE TRIGGER update_package_templates_updated_at
  BEFORE UPDATE ON package_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. 주석
-- ============================================
COMMENT ON TABLE package_templates IS '수강권 템플릿 - 한 코칭에 여러 종류의 수강권 생성 가능';
COMMENT ON COLUMN package_templates.total_sessions IS '총 횟수 (NULL이면 무제한)';
COMMENT ON COLUMN package_templates.validity_days IS '유효기간 (일) - 30일, 365일 등';
COMMENT ON COLUMN package_templates.type IS 'session_based (횟수 기반), time_based (기간 기반), unlimited (무제한)';
COMMENT ON FUNCTION create_package_from_template(UUID, UUID) IS '템플릿으로부터 실제 수강권 생성';
COMMENT ON FUNCTION get_coaching_package_templates(UUID) IS '코칭의 수강권 템플릿 목록 (활성화된 것만)';
COMMENT ON FUNCTION get_student_packages_with_templates(UUID) IS '학생의 수강권 목록 (템플릿 정보 포함)';

-- ============================================
-- 9. 검증 쿼리
-- ============================================

-- 코칭별 수강권 템플릿 확인
SELECT
  c.title as coaching,
  pt.name as package_name,
  pt.total_sessions as sessions,
  pt.validity_days as days,
  pt.price,
  pt.is_active
FROM package_templates pt
JOIN coachings c ON pt.coaching_id = c.id
ORDER BY c.title, pt.display_order;

-- 학생의 수강권 확인 (템플릿 연결 포함)
SELECT
  u.name as student,
  c.title as coaching,
  p.name as package_name,
  p.total_sessions,
  p.remaining_sessions,
  p.expires_at,
  pt.name as template_name
FROM packages p
JOIN users u ON p.student_id = u.id
JOIN coachings c ON p.coaching_id = c.id
LEFT JOIN package_templates pt ON p.package_template_id = pt.id
ORDER BY u.name, p.expires_at;

-- ============================================
-- 마이그레이션 완료
-- ============================================
