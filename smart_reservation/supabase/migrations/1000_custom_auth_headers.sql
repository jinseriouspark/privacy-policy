-- Create a function to get user email from custom JWT headers
-- This allows RLS policies to work with our Google OAuth custom JWT system

CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Try to get email from custom header first (our custom JWT system)
  user_email := current_setting('request.headers', true)::json->>'x-user-email';

  -- Fallback to Supabase Auth if custom header not present
  IF user_email IS NULL OR user_email = '' THEN
    user_email := auth.jwt()->>'email';
  END IF;

  RETURN user_email;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS BIGINT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  user_id_text TEXT;
  user_id BIGINT;
BEGIN
  -- Try to get user ID from custom header first (our custom JWT system)
  user_id_text := current_setting('request.headers', true)::json->>'x-user-id';

  -- Convert to BIGINT if present
  IF user_id_text IS NOT NULL AND user_id_text != '' THEN
    BEGIN
      user_id := user_id_text::BIGINT;
      RETURN user_id;
    EXCEPTION WHEN OTHERS THEN
      RETURN NULL;
    END;
  END IF;

  -- Fallback to Supabase Auth if custom header not present
  -- (This would require additional mapping logic)
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.current_user_email() IS 'Returns current user email from custom JWT headers or Supabase Auth';
COMMENT ON FUNCTION public.current_user_id() IS 'Returns current user ID from custom JWT headers';
