-- ============================================
-- Notion Integration Settings
-- ============================================
-- 강사가 Notion을 연동하여 학생 상담 메모를 Notion Database에 저장할 수 있도록 설정
-- Integration Token은 Supabase Vault에 암호화되어 저장됨

-- 1. Notion 설정 테이블 생성
CREATE TABLE IF NOT EXISTS public.user_notion_settings (
  user_id BIGINT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  database_id TEXT NOT NULL,  -- Notion Database ID (평문)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS 활성화
ALTER TABLE public.user_notion_settings ENABLE ROW LEVEL SECURITY;

-- 3. RLS 정책: 본인만 조회/수정 가능
CREATE POLICY "Users can view their own Notion settings"
  ON public.user_notion_settings
  FOR SELECT
  USING (user_id = (SELECT id FROM public.users WHERE email = auth.jwt()->>'email'::text));

CREATE POLICY "Users can update their own Notion settings"
  ON public.user_notion_settings
  FOR ALL
  USING (user_id = (SELECT id FROM public.users WHERE email = auth.jwt()->>'email'::text));

-- 4. Integration Token을 Vault에 저장하는 함수
CREATE OR REPLACE FUNCTION save_notion_settings(
  p_user_id BIGINT,
  p_integration_token TEXT,
  p_database_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_secret_id UUID;
BEGIN
  -- 1. Integration Token을 Vault에 암호화 저장
  INSERT INTO vault.secrets (secret, name, description)
  VALUES (
    p_integration_token,
    'notion_integration_token_' || p_user_id::TEXT,
    'Notion Integration Token for user ' || p_user_id::TEXT
  )
  ON CONFLICT (name) DO UPDATE
  SET secret = EXCLUDED.secret,
      updated_at = NOW()
  RETURNING id INTO v_secret_id;

  -- 2. 사용자 설정 테이블에 Database ID 저장
  INSERT INTO public.user_notion_settings (user_id, database_id, is_active)
  VALUES (p_user_id, p_database_id, TRUE)
  ON CONFLICT (user_id) DO UPDATE
  SET database_id = EXCLUDED.database_id,
      is_active = TRUE,
      updated_at = NOW();
END;
$$;

-- 5. Notion 설정 조회 함수 (Integration Token 복호화)
CREATE OR REPLACE FUNCTION get_notion_settings(p_user_id BIGINT)
RETURNS TABLE (
  integration_token TEXT,
  database_id TEXT,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vault.decrypted_secret AS integration_token,
    uns.database_id,
    uns.is_active
  FROM public.user_notion_settings uns
  LEFT JOIN vault.decrypted_secrets vs
    ON vs.name = 'notion_integration_token_' || p_user_id::TEXT
  WHERE uns.user_id = p_user_id;
END;
$$;

-- 6. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_user_notion_settings_user_id
  ON public.user_notion_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_user_notion_settings_is_active
  ON public.user_notion_settings(is_active);

-- 7. 코멘트 추가
COMMENT ON TABLE public.user_notion_settings IS '강사별 Notion 연동 설정';
COMMENT ON COLUMN public.user_notion_settings.database_id IS 'Notion Database ID (32자리 영문+숫자)';
COMMENT ON COLUMN public.user_notion_settings.is_active IS 'Notion 연동 활성화 여부';
COMMENT ON FUNCTION save_notion_settings IS 'Notion Integration Token을 암호화하여 저장';
COMMENT ON FUNCTION get_notion_settings IS 'Notion 설정 조회 (Integration Token 복호화)';
