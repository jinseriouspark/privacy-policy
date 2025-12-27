-- ============================================================================
-- Migration 022: Fix Auto User Creation (Remove auto 'student' assignment)
-- ============================================================================
-- Purpose: Ensure new users get user_type = NULL (not 'student')
-- This allows the onboarding flow to work properly
-- ============================================================================

BEGIN;

-- Drop existing handle_new_user function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create new handle_new_user function that does NOT set user_type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, picture, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'picture',
    NULL -- IMPORTANT: Set to NULL, not 'student'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name),
    picture = COALESCE(EXCLUDED.picture, users.picture);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Log migration status
DO $$
BEGIN
  RAISE NOTICE '=== Auto User Creation Fixed ===';
  RAISE NOTICE 'New users will have user_type = NULL';
  RAISE NOTICE 'Users must select account type during onboarding';
END $$;

COMMIT;
