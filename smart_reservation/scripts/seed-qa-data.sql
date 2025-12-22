-- ============================================================================
-- QA Testing Seed Data Script
-- ============================================================================
-- Purpose: Generate realistic test data for QA testing
-- Includes: 1 instructor + 10 students + coachings + reservations + packages
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CREATE TEST INSTRUCTOR
-- ============================================================================

-- Instructor: 김코치 (test-instructor@yeyak-mania.com)
INSERT INTO users (id, email, name, picture, user_type, username, bio, short_id)
VALUES (
  'test-instructor-uuid-0001',
  'test-instructor@yeyak-mania.com',
  '김코치',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor',
  'instructor',
  'coach-kim',
  '10년 경력의 필라테스 & 요가 전문가입니다. 개인의 체형과 목표에 맞춘 맞춤형 수업을 제공합니다.',
  'COACH001'
) ON CONFLICT (id) DO NOTHING;

-- Instructor settings (business hours)
INSERT INTO settings (id, instructor_id, timezone, business_hours, buffer_time)
VALUES (
  gen_random_uuid(),
  'test-instructor-uuid-0001',
  'Asia/Seoul',
  '{
    "0": {"start": "09:00", "end": "18:00", "isWorking": false},
    "1": {"start": "09:00", "end": "21:00", "isWorking": true},
    "2": {"start": "09:00", "end": "21:00", "isWorking": true},
    "3": {"start": "09:00", "end": "21:00", "isWorking": true},
    "4": {"start": "09:00", "end": "21:00", "isWorking": true},
    "5": {"start": "09:00", "end": "21:00", "isWorking": true},
    "6": {"start": "09:00", "end": "15:00", "isWorking": true}
  }'::jsonb,
  15
) ON CONFLICT (instructor_id) DO NOTHING;

-- ============================================================================
-- 2. CREATE TEST COACHINGS
-- ============================================================================

INSERT INTO coachings (id, instructor_id, title, slug, type, description, duration, price, credits, valid_days, is_active, status)
VALUES
  (
    'coaching-pilates-private',
    'test-instructor-uuid-0001',
    '필라테스 개인 레슨',
    'pilates-private',
    'private',
    '1:1 맞춤형 필라테스 수업입니다. 개인의 체형과 목표에 맞춰 진행됩니다.',
    60,
    80000,
    10,
    30,
    true,
    'active'
  ),
  (
    'coaching-yoga-group',
    'test-instructor-uuid-0001',
    '요가 그룹 수업',
    'yoga-group',
    'group',
    '최대 6명이 함께하는 힐링 요가 수업입니다.',
    90,
    50000,
    12,
    45,
    true,
    'active'
  ),
  (
    'coaching-stretching',
    'test-instructor-uuid-0001',
    '스트레칭 클래스',
    'stretching-class',
    'private',
    '전신 스트레칭으로 긴장을 풀고 유연성을 향상시킵니다.',
    45,
    50000,
    8,
    30,
    true,
    'active'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. CREATE TEST STUDENTS (10명)
-- ============================================================================

INSERT INTO users (id, email, name, picture, user_type, username, bio, short_id)
VALUES
  (
    'student-uuid-0001',
    'student01@test.com',
    '이지은',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=jieun',
    'student',
    'jieun-lee',
    '필라테스 초보입니다',
    'STD001'
  ),
  (
    'student-uuid-0002',
    'student02@test.com',
    '박서준',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=seojun',
    'student',
    'seojun-park',
    '요가로 스트레스 해소하고 있어요',
    'STD002'
  ),
  (
    'student-uuid-0003',
    'student03@test.com',
    '김민지',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=minji',
    'student',
    'minji-kim',
    '체형 교정 목적으로 시작했습니다',
    'STD003'
  ),
  (
    'student-uuid-0004',
    'student04@test.com',
    '최수빈',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=subin',
    'student',
    'subin-choi',
    '운동 좋아하는 직장인입니다',
    'STD004'
  ),
  (
    'student-uuid-0005',
    'student05@test.com',
    '정하은',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=haeun',
    'student',
    'haeun-jung',
    '꾸준히 운동하고 있어요',
    'STD005'
  ),
  (
    'student-uuid-0006',
    'student06@test.com',
    '강동우',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=dongwoo',
    'student',
    'dongwoo-kang',
    '재활 운동 중입니다',
    'STD006'
  ),
  (
    'student-uuid-0007',
    'student07@test.com',
    '윤서아',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=seoa',
    'student',
    'seoa-yoon',
    '다이어트 목적으로 시작했어요',
    'STD007'
  ),
  (
    'student-uuid-0008',
    'student08@test.com',
    '임지호',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=jiho',
    'student',
    'jiho-lim',
    '건강 관리에 관심이 많습니다',
    'STD008'
  ),
  (
    'student-uuid-0009',
    'student09@test.com',
    '한예린',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=yerin',
    'student',
    'yerin-han',
    '필라테스 3년차입니다',
    'STD009'
  ),
  (
    'student-uuid-0010',
    'student10@test.com',
    '송민준',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=minjun',
    'student',
    'minjun-song',
    '유연성 향상이 목표입니다',
    'STD010'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. CREATE STUDENT-INSTRUCTOR RELATIONSHIPS
-- ============================================================================

INSERT INTO student_instructors (id, student_id, instructor_id, coaching_id, created_at)
SELECT
  gen_random_uuid(),
  u.id,
  'test-instructor-uuid-0001',
  'coaching-pilates-private',
  NOW()
FROM users u
WHERE u.user_type = 'student' AND u.email LIKE 'student%@test.com'
ON CONFLICT (student_id, instructor_id, coaching_id) DO NOTHING;

-- Add some students to yoga group coaching
INSERT INTO student_instructors (id, student_id, instructor_id, coaching_id, created_at)
VALUES
  (gen_random_uuid(), 'student-uuid-0002', 'test-instructor-uuid-0001', 'coaching-yoga-group', NOW()),
  (gen_random_uuid(), 'student-uuid-0004', 'test-instructor-uuid-0001', 'coaching-yoga-group', NOW()),
  (gen_random_uuid(), 'student-uuid-0006', 'test-instructor-uuid-0001', 'coaching-yoga-group', NOW()),
  (gen_random_uuid(), 'student-uuid-0008', 'test-instructor-uuid-0001', 'coaching-yoga-group', NOW())
ON CONFLICT (student_id, instructor_id, coaching_id) DO NOTHING;

-- ============================================================================
-- 5. CREATE PACKAGES (수강권)
-- ============================================================================

INSERT INTO packages (id, student_id, instructor_id, coaching_id, name, total_sessions, remaining_sessions, start_date, expires_at)
SELECT
  gen_random_uuid(),
  u.id,
  'test-instructor-uuid-0001',
  'coaching-pilates-private',
  '필라테스 10회권',
  10,
  CASE
    WHEN u.id = 'student-uuid-0001' THEN 8
    WHEN u.id = 'student-uuid-0002' THEN 5
    WHEN u.id = 'student-uuid-0003' THEN 10
    WHEN u.id = 'student-uuid-0004' THEN 3
    WHEN u.id = 'student-uuid-0005' THEN 7
    ELSE 6
  END,
  NOW() - INTERVAL '15 days',
  NOW() + INTERVAL '15 days'
FROM users u
WHERE u.user_type = 'student' AND u.email LIKE 'student%@test.com' AND u.id <= 'student-uuid-0006'
ON CONFLICT DO NOTHING;

-- Add yoga group packages
INSERT INTO packages (id, student_id, instructor_id, coaching_id, name, total_sessions, remaining_sessions, start_date, expires_at)
VALUES
  (gen_random_uuid(), 'student-uuid-0002', 'test-instructor-uuid-0001', 'coaching-yoga-group', '요가 12회권', 12, 9, NOW() - INTERVAL '20 days', NOW() + INTERVAL '25 days'),
  (gen_random_uuid(), 'student-uuid-0004', 'test-instructor-uuid-0001', 'coaching-yoga-group', '요가 12회권', 12, 4, NOW() - INTERVAL '30 days', NOW() + INTERVAL '15 days'),
  (gen_random_uuid(), 'student-uuid-0006', 'test-instructor-uuid-0001', 'coaching-yoga-group', '요가 12회권', 12, 11, NOW() - INTERVAL '5 days', NOW() + INTERVAL '40 days'),
  (gen_random_uuid(), 'student-uuid-0008', 'test-instructor-uuid-0001', 'coaching-yoga-group', '요가 12회권', 12, 2, NOW() - INTERVAL '35 days', NOW() + INTERVAL '10 days')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. CREATE RESERVATIONS (Past & Future)
-- ============================================================================

-- Past reservations (completed & attended)
INSERT INTO reservations (
  id, student_id, instructor_id, coaching_id, package_id,
  start_time, end_time, status, attendance_status, notes, created_at
)
SELECT
  gen_random_uuid(),
  'student-uuid-0001',
  'test-instructor-uuid-0001',
  'coaching-pilates-private',
  (SELECT id FROM packages WHERE student_id = 'student-uuid-0001' AND coaching_id = 'coaching-pilates-private' LIMIT 1),
  NOW() - INTERVAL '7 days' + (day * INTERVAL '1 day') + INTERVAL '14 hours',
  NOW() - INTERVAL '7 days' + (day * INTERVAL '1 day') + INTERVAL '15 hours',
  'confirmed',
  'attended',
  NULL,
  NOW() - INTERVAL '8 days'
FROM generate_series(0, 1) AS day
ON CONFLICT DO NOTHING;

-- Future reservations (confirmed, pending today & tomorrow)
INSERT INTO reservations (
  id, student_id, instructor_id, coaching_id, package_id,
  start_time, end_time, status, attendance_status, notes, created_at
)
VALUES
  -- Today's reservations
  (gen_random_uuid(), 'student-uuid-0002', 'test-instructor-uuid-0001', 'coaching-pilates-private',
   (SELECT id FROM packages WHERE student_id = 'student-uuid-0002' LIMIT 1),
   NOW() + INTERVAL '2 hours', NOW() + INTERVAL '3 hours', 'confirmed', 'pending', NULL, NOW() - INTERVAL '1 day'),

  (gen_random_uuid(), 'student-uuid-0004', 'test-instructor-uuid-0001', 'coaching-yoga-group',
   (SELECT id FROM packages WHERE student_id = 'student-uuid-0004' AND coaching_id = 'coaching-yoga-group' LIMIT 1),
   NOW() + INTERVAL '5 hours', NOW() + INTERVAL '6 hours 30 minutes', 'confirmed', 'pending', NULL, NOW() - INTERVAL '2 days'),

  -- Tomorrow's reservations
  (gen_random_uuid(), 'student-uuid-0003', 'test-instructor-uuid-0001', 'coaching-pilates-private',
   (SELECT id FROM packages WHERE student_id = 'student-uuid-0003' LIMIT 1),
   NOW() + INTERVAL '1 day' + INTERVAL '10 hours', NOW() + INTERVAL '1 day' + INTERVAL '11 hours', 'confirmed', 'pending', NULL, NOW()),

  (gen_random_uuid(), 'student-uuid-0005', 'test-instructor-uuid-0001', 'coaching-pilates-private',
   (SELECT id FROM packages WHERE student_id = 'student-uuid-0005' LIMIT 1),
   NOW() + INTERVAL '1 day' + INTERVAL '14 hours', NOW() + INTERVAL '1 day' + INTERVAL '15 hours', 'confirmed', 'pending', NULL, NOW()),

  -- Next week reservations
  (gen_random_uuid(), 'student-uuid-0001', 'test-instructor-uuid-0001', 'coaching-pilates-private',
   (SELECT id FROM packages WHERE student_id = 'student-uuid-0001' LIMIT 1),
   NOW() + INTERVAL '3 days' + INTERVAL '15 hours', NOW() + INTERVAL '3 days' + INTERVAL '16 hours', 'confirmed', 'pending', NULL, NOW()),

  (gen_random_uuid(), 'student-uuid-0006', 'test-instructor-uuid-0001', 'coaching-yoga-group',
   (SELECT id FROM packages WHERE student_id = 'student-uuid-0006' AND coaching_id = 'coaching-yoga-group' LIMIT 1),
   NOW() + INTERVAL '5 days' + INTERVAL '18 hours', NOW() + INTERVAL '5 days' + INTERVAL '19 hours 30 minutes', 'confirmed', 'pending', NULL, NOW()),

  (gen_random_uuid(), 'student-uuid-0007', 'test-instructor-uuid-0001', 'coaching-pilates-private',
   (SELECT id FROM packages WHERE student_id = 'student-uuid-0007' LIMIT 1),
   NOW() + INTERVAL '6 days' + INTERVAL '11 hours', NOW() + INTERVAL '6 days' + INTERVAL '12 hours', 'confirmed', 'pending', NULL, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. CREATE ACTIVITY LOGS
-- ============================================================================

INSERT INTO activity_logs (id, user_id, action, tab_name, metadata, created_at)
SELECT
  gen_random_uuid(),
  'test-instructor-uuid-0001',
  'view_tab',
  tab,
  '{}'::jsonb,
  NOW() - INTERVAL '1 hour' * row_number
FROM (
  SELECT unnest(ARRAY['stats', 'reservations', 'users', 'packages', 'settings', 'class']) AS tab
) tabs,
generate_series(1, 3) AS row_number
ON CONFLICT DO NOTHING;

-- Student activity logs
INSERT INTO activity_logs (id, user_id, action, tab_name, metadata, created_at)
SELECT
  gen_random_uuid(),
  u.id,
  'view_dashboard',
  NULL,
  '{}'::jsonb,
  NOW() - INTERVAL '12 hours'
FROM users u
WHERE u.user_type = 'student' AND u.email LIKE 'student%@test.com'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
DECLARE
  instructor_count INTEGER;
  student_count INTEGER;
  coaching_count INTEGER;
  package_count INTEGER;
  reservation_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO instructor_count FROM users WHERE user_type = 'instructor' AND email LIKE 'test-instructor%';
  SELECT COUNT(*) INTO student_count FROM users WHERE user_type = 'student' AND email LIKE 'student%@test.com';
  SELECT COUNT(*) INTO coaching_count FROM coachings WHERE instructor_id = 'test-instructor-uuid-0001';
  SELECT COUNT(*) INTO package_count FROM packages WHERE instructor_id = 'test-instructor-uuid-0001';
  SELECT COUNT(*) INTO reservation_count FROM reservations WHERE instructor_id = 'test-instructor-uuid-0001';

  RAISE NOTICE '=== QA Test Data Created ===';
  RAISE NOTICE 'Instructors: %', instructor_count;
  RAISE NOTICE 'Students: %', student_count;
  RAISE NOTICE 'Coachings: %', coaching_count;
  RAISE NOTICE 'Packages: %', package_count;
  RAISE NOTICE 'Reservations: %', reservation_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Login credentials:';
  RAISE NOTICE 'Instructor: test-instructor@yeyak-mania.com';
  RAISE NOTICE 'Students: student01@test.com ~ student10@test.com';
  RAISE NOTICE '';
  RAISE NOTICE 'Coaching URLs:';
  RAISE NOTICE '- Pilates: /pilates-private';
  RAISE NOTICE '- Yoga: /yoga-group';
  RAISE NOTICE '- Stretching: /stretching-class';
END $$;

COMMIT;
