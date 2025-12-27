-- Check if RLS policies are correctly applied

-- List all policies on packages table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'packages'
ORDER BY policyname;

-- Check if RLS is enabled on packages table
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'packages';

-- Alternative: Check auth.uid() instead of auth.email()
-- Supabase uses auth.uid() which returns the authenticated user's UUID
SELECT auth.uid() as current_user_id;

-- Check if there's a user with this auth.uid()
SELECT id, email, name
FROM users
WHERE id::text = auth.uid()::text
   OR email = (SELECT email FROM auth.users WHERE id = auth.uid());
