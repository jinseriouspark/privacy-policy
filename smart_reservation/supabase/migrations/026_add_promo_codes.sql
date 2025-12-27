-- Migration 026: Promo Codes System
-- 마스터마인드 등 특별 할인 쿠폰 시스템

-- ============================================
-- 1. 프로모션 코드 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value INTEGER NOT NULL, -- percentage: 0-100, fixed_amount: 원 단위
  plan_id TEXT REFERENCES subscription_plans(id),
  max_uses INTEGER, -- NULL이면 무제한
  current_uses INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. 프로모션 코드 사용 내역
-- ============================================
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id),
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(promo_code_id, user_id) -- 한 사용자는 동일 코드 1회만 사용
);

-- ============================================
-- 3. 인덱스
-- ============================================
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active, valid_until);
CREATE INDEX IF NOT EXISTS idx_promo_code_usage_user ON promo_code_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_usage_code ON promo_code_usage(promo_code_id);

-- ============================================
-- 4. 마스터마인드 프로모션 코드 생성
-- ============================================
INSERT INTO promo_codes (code, description, discount_type, discount_value, plan_id, max_uses, valid_until)
VALUES
  ('MASTERMIND2025', '마스터마인드 특별 할인 (₩19,000 → ₩10,000)', 'fixed_amount', 9000, 'standard', NULL, '2025-12-31 23:59:59+09'),
  ('EARLYBIRD', '얼리버드 할인 (50% OFF)', 'percentage', 50, 'standard', 100, '2025-03-31 23:59:59+09'),
  ('FRIENDS', '지인 초대 할인 (30% OFF)', 'percentage', 30, 'standard', NULL, NULL)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 5. Helper Functions
-- ============================================

-- 프로모션 코드 유효성 검증
CREATE OR REPLACE FUNCTION validate_promo_code(p_code TEXT, p_user_id UUID)
RETURNS TABLE (
  is_valid BOOLEAN,
  message TEXT,
  discount_amount INTEGER,
  final_price INTEGER
) AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_plan subscription_plans%ROWTYPE;
  v_already_used BOOLEAN;
BEGIN
  -- 프로모션 코드 조회
  SELECT * INTO v_promo FROM promo_codes WHERE code = p_code AND is_active = true;

  -- 코드 존재 여부 확인
  IF v_promo.id IS NULL THEN
    RETURN QUERY SELECT false, '유효하지 않은 프로모션 코드입니다.', 0, 0;
    RETURN;
  END IF;

  -- 유효 기간 확인
  IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < NOW() THEN
    RETURN QUERY SELECT false, '만료된 프로모션 코드입니다.', 0, 0;
    RETURN;
  END IF;

  IF NOW() < v_promo.valid_from THEN
    RETURN QUERY SELECT false, '아직 사용할 수 없는 프로모션 코드입니다.', 0, 0;
    RETURN;
  END IF;

  -- 사용 횟수 확인
  IF v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses THEN
    RETURN QUERY SELECT false, '프로모션 코드 사용 가능 횟수를 초과했습니다.', 0, 0;
    RETURN;
  END IF;

  -- 중복 사용 확인
  SELECT EXISTS(
    SELECT 1 FROM promo_code_usage WHERE promo_code_id = v_promo.id AND user_id = p_user_id
  ) INTO v_already_used;

  IF v_already_used THEN
    RETURN QUERY SELECT false, '이미 사용한 프로모션 코드입니다.', 0, 0;
    RETURN;
  END IF;

  -- 플랜 정보 조회
  SELECT * INTO v_plan FROM subscription_plans WHERE id = v_promo.plan_id;

  -- 할인 금액 계산
  DECLARE
    v_discount_amount INTEGER;
    v_final_price INTEGER;
  BEGIN
    IF v_promo.discount_type = 'percentage' THEN
      v_discount_amount := (v_plan.monthly_price * v_promo.discount_value / 100);
    ELSE
      v_discount_amount := v_promo.discount_value;
    END IF;

    v_final_price := GREATEST(0, v_plan.monthly_price - v_discount_amount);

    RETURN QUERY SELECT true, '프로모션 코드가 적용되었습니다.', v_discount_amount, v_final_price;
  END;
END;
$$ LANGUAGE plpgsql;

-- 프로모션 코드 사용 처리
CREATE OR REPLACE FUNCTION apply_promo_code(p_code TEXT, p_user_id UUID, p_subscription_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_promo_id UUID;
BEGIN
  -- 프로모션 코드 ID 조회
  SELECT id INTO v_promo_id FROM promo_codes WHERE code = p_code AND is_active = true;

  IF v_promo_id IS NULL THEN
    RETURN false;
  END IF;

  -- 사용 내역 추가
  INSERT INTO promo_code_usage (promo_code_id, user_id, subscription_id)
  VALUES (v_promo_id, p_user_id, p_subscription_id)
  ON CONFLICT (promo_code_id, user_id) DO NOTHING;

  -- 사용 횟수 증가
  UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = v_promo_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. RLS (Row Level Security)
-- ============================================
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 활성 프로모션 코드 조회 가능
CREATE POLICY "Anyone can view active promo codes"
  ON promo_codes FOR SELECT
  USING (is_active = true);

-- 사용자는 자신의 사용 내역만 조회 가능
CREATE POLICY "Users can view own usage"
  ON promo_code_usage FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- 7. 주석
-- ============================================
COMMENT ON TABLE promo_codes IS '프로모션 코드 (할인 쿠폰)';
COMMENT ON TABLE promo_code_usage IS '프로모션 코드 사용 내역';
COMMENT ON FUNCTION validate_promo_code(TEXT, UUID) IS '프로모션 코드 유효성 검증 및 할인 금액 계산';
COMMENT ON FUNCTION apply_promo_code(TEXT, UUID, UUID) IS '프로모션 코드 사용 처리';

-- ============================================
-- 8. 이메일 화이트리스트 (자동 할인 적용)
-- ============================================
CREATE TABLE IF NOT EXISTS promo_email_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE SET NULL,
  auto_apply BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_email_whitelist_email ON promo_email_whitelist(email);

-- 마스터마인드 이메일 등록 예시
-- INSERT INTO promo_email_whitelist (email, promo_code_id, note)
-- SELECT
--   'mastermind1@example.com',
--   (SELECT id FROM promo_codes WHERE code = 'MASTERMIND2025'),
--   '마스터마인드 창립 멤버'
-- ON CONFLICT (email) DO NOTHING;

-- 로그인 시 자동 쿠폰 적용 함수
CREATE OR REPLACE FUNCTION auto_apply_promo_on_login(p_user_email TEXT, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_promo_code TEXT;
  v_promo_code_id UUID;
  v_already_applied BOOLEAN;
BEGIN
  -- 화이트리스트 확인
  SELECT pc.code, pw.promo_code_id INTO v_promo_code, v_promo_code_id
  FROM promo_email_whitelist pw
  JOIN promo_codes pc ON pw.promo_code_id = pc.id
  WHERE pw.email = p_user_email AND pw.auto_apply = true AND pc.is_active = true;

  IF v_promo_code IS NULL THEN
    RETURN NULL;
  END IF;

  -- 이미 사용했는지 확인
  SELECT EXISTS(
    SELECT 1 FROM promo_code_usage WHERE promo_code_id = v_promo_code_id AND user_id = p_user_id
  ) INTO v_already_applied;

  IF v_already_applied THEN
    RETURN NULL;
  END IF;

  -- 쿠폰 코드 반환 (프론트엔드에서 표시)
  RETURN v_promo_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE promo_email_whitelist IS '특정 이메일 자동 할인 화이트리스트';
COMMENT ON FUNCTION auto_apply_promo_on_login(TEXT, UUID) IS '로그인 시 자동으로 쿠폰 코드 반환';

-- ============================================
-- 9. 검증 쿼리
-- ============================================

-- 활성 프로모션 코드 목록
SELECT code, description, discount_type, discount_value, current_uses, max_uses
FROM promo_codes
WHERE is_active = true
  AND (valid_until IS NULL OR valid_until > NOW());

-- 마스터마인드 코드 테스트
SELECT * FROM validate_promo_code('MASTERMIND2025', 'USER_UUID_HERE');
