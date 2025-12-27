-- Debug RLS Issues
-- This script helps identify why packages aren't showing

-- 1. Check current user's auth email
SELECT auth.email() as current_user_email;

-- 2. Check if user exists in users table
SELECT id, email, name
FROM users
WHERE email = auth.email();

-- 3. Check packages for this user (bypass RLS)
SELECT p.id, p.student_id, p.credits_remaining, p.deleted_at,
       u.id as user_id, u.email as user_email
FROM packages p
JOIN users u ON p.student_id = u.id
WHERE u.email = auth.email();

-- 4. Test the RLS policy manually
SELECT p.*
FROM packages p
WHERE p.student_id IN (
  SELECT id FROM users WHERE email = auth.email()
)
AND p.deleted_at IS NULL;

-- 5. Check what auth.email() returns vs what's in database
SELECT
  auth.email() as "Auth Email",
  (SELECT email FROM users WHERE email = auth.email()) as "Matched User Email",
  (SELECT COUNT(*) FROM packages WHERE student_id IN (SELECT id FROM users WHERE email = auth.email())) as "Package Count";
