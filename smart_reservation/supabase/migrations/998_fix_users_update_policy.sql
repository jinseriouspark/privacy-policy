-- Fix users UPDATE policy
-- Allow users to update their own profile based on email matching
-- This works with Supabase Auth (RLS enabled after session creation)

DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (
    -- Match email from Supabase Auth JWT
    email = COALESCE(
      auth.jwt()->>'email',  -- Email from Supabase Auth session
      (SELECT email FROM auth.users WHERE id = auth.uid())  -- Fallback to auth.users table
    )
  );

-- Also make short_id nullable since we're deprecating it
ALTER TABLE users ALTER COLUMN short_id DROP NOT NULL;
