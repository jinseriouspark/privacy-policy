-- Migration 027: Lifetime Access System
-- 특정 사용자에게 평생 무료 사용 권한 부여

-- ============================================
-- 1. users 테이블에 lifetime_access 컬럼 추가
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS lifetime_access BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lifetime_access_note TEXT; -- 부여 이유 메모

-- ============================================
-- 2. 인덱스
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_lifetime_access ON users(lifetime_access);

-- ============================================
-- 3. Helper Functions
-- ============================================

-- 평생 무료 사용 권한 부여
CREATE OR REPLACE FUNCTION grant_lifetime_access(p_user_id UUID, p_note TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE users
  SET
    lifetime_access = true,
    lifetime_access_note = p_note
  WHERE id = p_user_id;

  -- 해당 사용자에게 Standard 플랜 무료 구독 생성 (또는 업데이트)
  INSERT INTO user_subscriptions (user_id, plan_id, billing_cycle, status, current_period_start, current_period_end)
  VALUES (
    p_user_id,
    'standard',
    'monthly',
    'active',
    NOW(),
    NOW() + INTERVAL '100 years'  -- 평생
  )
  ON CONFLICT (user_id, status)
  DO UPDATE SET
    plan_id = 'standard',
    current_period_end = NOW() + INTERVAL '100 years';

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 평생 무료 사용 권한 해제
CREATE OR REPLACE FUNCTION revoke_lifetime_access(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE users
  SET
    lifetime_access = false,
    lifetime_access_note = NULL
  WHERE id = p_user_id;

  -- 구독을 Free 플랜으로 변경
  UPDATE user_subscriptions
  SET
    plan_id = 'free',
    current_period_end = NOW() + INTERVAL '100 years'
  WHERE user_id = p_user_id AND status = 'active';

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 사용자가 평생 무료 사용 권한이 있는지 확인
CREATE OR REPLACE FUNCTION has_lifetime_access(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_access BOOLEAN;
BEGIN
  SELECT lifetime_access INTO v_has_access
  FROM users
  WHERE id = p_user_id;

  RETURN COALESCE(v_has_access, false);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. 예시: 특정 사용자에게 평생 무료 부여
-- ============================================

-- 사용 방법:
-- SELECT grant_lifetime_access('USER_UUID_HERE', '마스터마인드 창립 멤버');
-- SELECT grant_lifetime_access('USER_UUID_HERE', '베타 테스터');
-- SELECT grant_lifetime_access('USER_UUID_HERE', '특별 기여자');

-- 예시 데이터 (실제 UUID로 교체 필요)
-- INSERT INTO users (email, name, lifetime_access, lifetime_access_note)
-- VALUES
--   ('mastermind1@example.com', '홍길동', true, '마스터마인드 창립 멤버'),
--   ('mastermind2@example.com', '김철수', true, '마스터마인드 창립 멤버')
-- ON CONFLICT (email) DO UPDATE SET
--   lifetime_access = true,
--   lifetime_access_note = EXCLUDED.lifetime_access_note;

-- ============================================
-- 5. 구독 결제 로직 수정 (사용 시)
-- ============================================

-- 결제 전 lifetime_access 확인 함수
CREATE OR REPLACE FUNCTION should_charge_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- lifetime_access가 true이면 결제하지 않음
  RETURN NOT has_lifetime_access(p_user_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. 주석
-- ============================================
COMMENT ON COLUMN users.lifetime_access IS '평생 무료 사용 권한 (VIP, 베타 테스터 등)';
COMMENT ON COLUMN users.lifetime_access_note IS '평생 무료 부여 이유 메모';
COMMENT ON FUNCTION grant_lifetime_access(UUID, TEXT) IS '사용자에게 평생 무료 Standard 플랜 부여';
COMMENT ON FUNCTION revoke_lifetime_access(UUID) IS '평생 무료 권한 해제';
COMMENT ON FUNCTION has_lifetime_access(UUID) IS '사용자의 평생 무료 권한 확인';
COMMENT ON FUNCTION should_charge_user(UUID) IS '사용자에게 결제를 요청해야 하는지 확인';

-- ============================================
-- 7. 검증 쿼리
-- ============================================

-- 평생 무료 사용자 목록
SELECT id, email, name, lifetime_access_note, created_at
FROM users
WHERE lifetime_access = true
ORDER BY created_at;

-- 평생 무료 사용자 수
SELECT COUNT(*) as lifetime_access_users
FROM users
WHERE lifetime_access = true;
