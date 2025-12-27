-- Migration 025: Update Pricing - Instructors Only
-- 학생은 무료, 강사만 구독 필요

-- ============================================
-- 1. 기존 플랜 삭제 및 새 플랜 삽입
-- ============================================

-- 기존 플랜 삭제
DELETE FROM subscription_plans;

-- 새 플랜 정의
INSERT INTO subscription_plans (id, name, display_name, description, monthly_price, yearly_price, features, limits) VALUES

-- Free Plan (강사 시작용)
('free', 'free', 'Free', '개인 강사를 위한 시작 플랜', 0, 0,
 '{
   "private_reservations": true,
   "group_classes": true,
   "membership_management": true,
   "attendance_check": true,
   "statistics": true,
   "email_notifications": true,
   "calendar_sync": true,
   "ad_free": true
 }'::jsonb,
 '{
   "max_students": 10,
   "max_reservations_per_month": null,
   "max_coachings": 1,
   "max_instructors": 1
 }'::jsonb),

-- Standard Plan (₩19,000/월)
('standard', 'standard', 'Standard', '성장하는 강사를 위한 필수 플랜', 19000, 190000,
 '{
   "private_reservations": true,
   "group_classes": true,
   "membership_management": true,
   "attendance_check": true,
   "statistics": true,
   "email_notifications": true,
   "calendar_sync": true,
   "ad_free": true,
   "priority_support": true
 }'::jsonb,
 '{
   "max_students": 500,
   "max_reservations_per_month": null,
   "max_coachings": 5,
   "max_instructors": 1
 }'::jsonb),

-- Teams Plan (준비 중)
('teams', 'teams', 'Teams', '준비 중입니다', 0, 0,
 '{
   "private_reservations": true,
   "group_classes": true,
   "membership_management": true,
   "attendance_check": true,
   "statistics": true,
   "email_notifications": true,
   "calendar_sync": true,
   "ad_free": true,
   "multi_instructor": true,
   "advanced_reporting": true,
   "sms_notifications": true,
   "priority_support": true,
   "coming_soon": true
 }'::jsonb,
 '{
   "max_students": null,
   "max_reservations_per_month": null,
   "max_coachings": null,
   "max_instructors": 5
 }'::jsonb),

-- Enterprise Plan (준비 중)
('enterprise', 'enterprise', 'Enterprise', '준비 중입니다', 0, 0,
 '{
   "private_reservations": true,
   "group_classes": true,
   "membership_management": true,
   "attendance_check": true,
   "statistics": true,
   "email_notifications": true,
   "calendar_sync": true,
   "ad_free": true,
   "multi_instructor": true,
   "advanced_reporting": true,
   "sms_notifications": true,
   "unlimited_instructors": true,
   "dedicated_support": true,
   "api_access": true,
   "custom_domain": true,
   "sso": true,
   "coming_soon": true
 }'::jsonb,
 '{
   "max_students": null,
   "max_reservations_per_month": null,
   "max_coachings": null,
   "max_instructors": null
 }'::jsonb)

ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  monthly_price = EXCLUDED.monthly_price,
  yearly_price = EXCLUDED.yearly_price,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  updated_at = NOW();

-- ============================================
-- 2. 모든 강사에게 Free 플랜 자동 할당
-- ============================================

-- 기존 instructor 역할을 가진 사용자에게 Free 구독 추가
INSERT INTO user_subscriptions (user_id, plan_id, billing_cycle, status, current_period_start, current_period_end)
SELECT
  ur.user_id,
  'free',
  'monthly',
  'active',
  NOW(),
  NOW() + INTERVAL '100 years'  -- Free는 영구
FROM user_roles ur
WHERE ur.role = 'instructor'
  AND NOT EXISTS (
    SELECT 1 FROM user_subscriptions us
    WHERE us.user_id = ur.user_id AND us.status = 'active'
  )
ON CONFLICT (user_id, status) DO NOTHING;

-- ============================================
-- 3. 학생은 구독 불필요 (제거)
-- ============================================

-- 학생 역할만 있는 사용자의 구독 제거
DELETE FROM user_subscriptions
WHERE user_id IN (
  SELECT user_id FROM user_roles
  WHERE role = 'student'
    AND user_id NOT IN (SELECT user_id FROM user_roles WHERE role = 'instructor')
);

-- ============================================
-- 4. Helper Functions
-- ============================================

-- 강사의 현재 구독 플랜 조회
CREATE OR REPLACE FUNCTION get_instructor_subscription(p_user_id UUID)
RETURNS TABLE (
  plan_id TEXT,
  plan_name TEXT,
  max_students INTEGER,
  max_coachings INTEGER,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.display_name,
    (sp.limits->>'max_students')::INTEGER,
    (sp.limits->>'max_coachings')::INTEGER,
    us.status
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id
    AND us.status = 'active'
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 강사가 새 학생/클래스를 추가할 수 있는지 확인
CREATE OR REPLACE FUNCTION can_add_resource(
  p_user_id UUID,
  p_resource_type TEXT  -- 'student' or 'coaching'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan_limit INTEGER;
  v_current_count INTEGER;
BEGIN
  -- 현재 플랜의 제한 조회
  SELECT
    CASE
      WHEN p_resource_type = 'student' THEN (sp.limits->>'max_students')::INTEGER
      WHEN p_resource_type = 'coaching' THEN (sp.limits->>'max_coachings')::INTEGER
      ELSE NULL
    END INTO v_plan_limit
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id AND us.status = 'active'
  LIMIT 1;

  -- 제한이 NULL이면 무제한
  IF v_plan_limit IS NULL THEN
    RETURN TRUE;
  END IF;

  -- 현재 사용량 확인
  IF p_resource_type = 'student' THEN
    -- 학생 수: packages 테이블에서 unique student_id 카운트
    SELECT COUNT(DISTINCT student_id) INTO v_current_count
    FROM packages
    WHERE instructor_id = p_user_id;
  ELSIF p_resource_type = 'coaching' THEN
    SELECT COUNT(*) INTO v_current_count
    FROM coachings
    WHERE instructor_id = p_user_id AND status = 'active';
  END IF;

  -- 제한 확인
  RETURN v_current_count < v_plan_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. 주석
-- ============================================

COMMENT ON FUNCTION get_instructor_subscription(UUID) IS '강사의 현재 활성 구독 플랜 정보 조회';
COMMENT ON FUNCTION can_add_resource(UUID, TEXT) IS '강사가 플랜 제한 내에서 리소스를 추가할 수 있는지 확인';

-- ============================================
-- 6. 검증 쿼리
-- ============================================

-- 각 플랜별 사용자 수
SELECT sp.display_name, COUNT(us.id) as user_count
FROM subscription_plans sp
LEFT JOIN user_subscriptions us ON sp.id = us.plan_id AND us.status = 'active'
GROUP BY sp.id, sp.display_name
ORDER BY sp.monthly_price;

-- Free 플랜 사용자 중 제한 초과 확인
SELECT
  u.email,
  u.name,
  (SELECT COUNT(*) FROM coachings WHERE instructor_id = u.id AND status = 'active') as coaching_count,
  (SELECT COUNT(DISTINCT student_id) FROM packages WHERE instructor_id = u.id) as student_count
FROM users u
JOIN user_subscriptions us ON u.id = us.user_id
WHERE us.plan_id = 'free'
  AND us.status = 'active'
  AND (
    (SELECT COUNT(*) FROM coachings WHERE instructor_id = u.id AND status = 'active') > 1
    OR (SELECT COUNT(DISTINCT student_id) FROM packages WHERE instructor_id = u.id) > 10
  );
