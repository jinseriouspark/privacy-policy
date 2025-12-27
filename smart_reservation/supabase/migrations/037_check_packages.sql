-- Check packages for pressame@gmail.com

-- 1. Find user ID for pressame@gmail.com
SELECT id, email, name, user_type
FROM users
WHERE email = 'pressame@gmail.com';

-- 2. Check all packages for this user
SELECT
  p.id,
  p.name,
  p.student_id,
  p.instructor_id,
  p.coaching_id,
  p.credits_total,
  p.credits_remaining,
  p.start_date,
  p.expires_at,
  p.status,
  p.created_at,
  u_student.email as student_email,
  u_instructor.email as instructor_email,
  u_instructor.name as instructor_name
FROM packages p
JOIN users u_student ON p.student_id = u_student.id
JOIN users u_instructor ON p.instructor_id = u_instructor.id
WHERE u_student.email = 'pressame@gmail.com'
ORDER BY p.created_at DESC;

-- 3. Count packages
SELECT COUNT(*) as total_packages
FROM packages p
JOIN users u ON p.student_id = u.id
WHERE u.email = 'pressame@gmail.com';
