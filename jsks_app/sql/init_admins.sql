-- ============================================================
-- 관리자 계정 초기화 (통합)
-- ============================================================

-- 1. Developer role 추가 (기존 테이블에 constraint 수정)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('monk', 'believer', 'developer'));

-- 2. 스님 계정 추가/업데이트
INSERT INTO users (email, name, role, tracking_ids, streak)
VALUES (
  'iddhi1@gmail.com',
  '지월스님',
  'monk',
  ARRAY['1', '2'], -- 필수 항목
  0
)
ON CONFLICT (email) DO UPDATE
SET role = 'monk', name = '지월스님';

-- 3. 개발자 계정 추가/업데이트
INSERT INTO users (email, name, role, tracking_ids, streak)
VALUES (
  'jseul45@gmail.com',
  '박진슬',
  'developer',
  ARRAY['1', '2'],
  0
)
ON CONFLICT (email) DO UPDATE
SET role = 'developer', name = '박진슬';

-- 확인
SELECT email, name, role FROM users WHERE email IN ('iddhi1@gmail.com', 'jseul45@gmail.com');
