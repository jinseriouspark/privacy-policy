-- Migration 023: Add Subscription System
-- 구독 플랜 및 사용자별 구독 관리 시스템

-- 1. 구독 플랜 테이블
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  monthly_price INTEGER NOT NULL DEFAULT 0, -- 원 단위
  yearly_price INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{}', -- 제한사항 (예: max_students, max_reservations_per_month)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 기본 플랜 데이터 삽입
INSERT INTO subscription_plans (id, name, display_name, description, monthly_price, yearly_price, features, limits) VALUES
  ('free', 'free', '무료', '개인 사용자를 위한 기본 예약 기능', 0, 0,
   '{"private_reservations": true, "group_classes": false, "membership_management": false, "attendance_check": false, "statistics": false, "email_notifications": true, "calendar_sync": true, "ad_free": false}'::jsonb,
   '{"max_students": 10, "max_reservations_per_month": 10, "max_coachings": 1, "max_instructors": 1}'::jsonb),

  ('standard', 'standard', 'Standard', '개인 강사를 위한 필수 기능', 5000, 50000,
   '{"private_reservations": true, "group_classes": true, "membership_management": true, "attendance_check": true, "statistics": true, "email_notifications": true, "calendar_sync": true, "ad_free": true}'::jsonb,
   '{"max_students": 100, "max_reservations_per_month": null, "max_coachings": 5, "max_instructors": 1}'::jsonb),

  ('teams', 'teams', 'Teams', '팀 협업을 위한 고급 기능', 8000, 80000,
   '{"private_reservations": true, "group_classes": true, "membership_management": true, "attendance_check": true, "statistics": true, "email_notifications": true, "calendar_sync": true, "ad_free": true, "multi_instructor": true, "advanced_reporting": true, "sms_notifications": true}'::jsonb,
   '{"max_students": 500, "max_reservations_per_month": null, "max_coachings": null, "max_instructors": 5}'::jsonb),

  ('enterprise', 'enterprise', 'Enterprise', '대규모 스튜디오를 위한 맞춤 솔루션', 0, 0,
   '{"private_reservations": true, "group_classes": true, "membership_management": true, "attendance_check": true, "statistics": true, "email_notifications": true, "calendar_sync": true, "ad_free": true, "multi_instructor": true, "advanced_reporting": true, "sms_notifications": true, "unlimited_instructors": true, "dedicated_support": true, "api_access": true, "custom_domain": true, "sso": true}'::jsonb,
   '{"max_students": null, "max_reservations_per_month": null, "max_coachings": null, "max_instructors": null}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 2. 사용자 구독 테이블
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- 'monthly' or 'yearly'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired', 'trial'
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 사용자당 하나의 활성 구독만 가능
  CONSTRAINT unique_active_subscription UNIQUE (user_id, status)
);

-- 3. 사용량 추적 테이블 (플랜 제한 확인용)
CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  reservations_count INTEGER NOT NULL DEFAULT 0,
  students_count INTEGER NOT NULL DEFAULT 0,
  coachings_count INTEGER NOT NULL DEFAULT 0,
  instructors_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, period_start, period_end)
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_id ON subscription_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_period ON subscription_usage(period_start, period_end);

-- 5. 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

CREATE TRIGGER trigger_update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

CREATE TRIGGER trigger_update_subscription_usage_updated_at
  BEFORE UPDATE ON subscription_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

-- 6. 신규 사용자에게 자동으로 Free 플랜 할당
CREATE OR REPLACE FUNCTION assign_free_plan_to_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 신규 사용자에게 Free 플랜 할당 (30일 기간)
  INSERT INTO user_subscriptions (
    user_id,
    plan_id,
    billing_cycle,
    status,
    current_period_start,
    current_period_end
  ) VALUES (
    NEW.id,
    'free',
    'monthly',
    'active',
    NOW(),
    NOW() + INTERVAL '30 days'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_assign_free_plan
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION assign_free_plan_to_new_user();

-- 7. RLS (Row Level Security) 설정
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 플랜 정보 조회 가능
CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans
  FOR SELECT
  USING (is_active = true);

-- 사용자는 자신의 구독 정보만 조회 가능
CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 사용량 정보만 조회 가능
CREATE POLICY "Users can view own usage"
  ON subscription_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- 8. 헬퍼 함수: 사용자의 현재 활성 구독 조회
CREATE OR REPLACE FUNCTION get_user_active_subscription(p_user_id UUID)
RETURNS TABLE (
  plan_id TEXT,
  plan_name TEXT,
  billing_cycle TEXT,
  status TEXT,
  features JSONB,
  limits JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    us.plan_id,
    sp.display_name,
    us.billing_cycle,
    us.status,
    sp.features,
    sp.limits
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id
    AND us.status = 'active'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 헬퍼 함수: 플랜 제한 확인
CREATE OR REPLACE FUNCTION check_plan_limit(
  p_user_id UUID,
  p_limit_type TEXT -- 'max_students', 'max_reservations_per_month', 'max_coachings', 'max_instructors'
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INTEGER,
  max_limit INTEGER,
  message TEXT
) AS $$
DECLARE
  v_subscription RECORD;
  v_current_count INTEGER;
  v_max_limit INTEGER;
BEGIN
  -- 사용자의 활성 구독 조회
  SELECT * INTO v_subscription
  FROM get_user_active_subscription(p_user_id);

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0, '활성 구독이 없습니다.'::TEXT;
    RETURN;
  END IF;

  -- 제한값 가져오기
  v_max_limit := (v_subscription.limits->>p_limit_type)::INTEGER;

  -- null이면 무제한
  IF v_max_limit IS NULL THEN
    RETURN QUERY SELECT true, 0, null, '무제한'::TEXT;
    RETURN;
  END IF;

  -- 현재 사용량 계산
  CASE p_limit_type
    WHEN 'max_students' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM student_instructors
      WHERE instructor_id = p_user_id;

    WHEN 'max_coachings' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM coachings
      WHERE instructor_id = p_user_id
        AND is_active = true;

    WHEN 'max_instructors' THEN
      -- Teams 이상: 여러 강사 협업 가능
      v_current_count := 1;

    WHEN 'max_reservations_per_month' THEN
      SELECT COUNT(*) INTO v_current_count
      FROM reservations
      WHERE instructor_id = p_user_id
        AND created_at >= date_trunc('month', CURRENT_DATE);

    ELSE
      v_current_count := 0;
  END CASE;

  -- 제한 확인
  IF v_current_count >= v_max_limit THEN
    RETURN QUERY SELECT false, v_current_count, v_max_limit,
      format('플랜 제한에 도달했습니다. (%s/%s)', v_current_count, v_max_limit)::TEXT;
  ELSE
    RETURN QUERY SELECT true, v_current_count, v_max_limit,
      format('사용 가능 (%s/%s)', v_current_count, v_max_limit)::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE subscription_plans IS '구독 플랜 정보 (Free, Standard, Teams, Enterprise)';
COMMENT ON TABLE user_subscriptions IS '사용자별 구독 정보';
COMMENT ON TABLE subscription_usage IS '사용자별 사용량 추적 (플랜 제한 확인용)';
COMMENT ON FUNCTION get_user_active_subscription IS '사용자의 현재 활성 구독 정보 조회';
COMMENT ON FUNCTION check_plan_limit IS '플랜 제한 확인 (학생 수, 예약 수 등)';
