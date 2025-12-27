-- ============================================
-- Solapi Settings Storage with Supabase Vault
-- ============================================
-- 각 강사가 자신의 Solapi API 키를 안전하게 저장
-- Supabase Vault를 사용해 자동 암호화/복호화

-- 1. Enable pgsodium extension (Supabase Vault 필요)
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- 2. Create secrets table using Vault
CREATE TABLE IF NOT EXISTS user_solapi_secrets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Encrypted fields using Vault
  api_key_secret UUID REFERENCES vault.secrets(id),
  api_secret_secret UUID REFERENCES vault.secrets(id),

  -- Non-sensitive fields (plain text OK)
  sender_phone TEXT,
  kakao_sender_key TEXT,
  template_id TEXT DEFAULT 'booking_link_v1',

  -- Metadata
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- 3. Create RLS policies
ALTER TABLE user_solapi_secrets ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own secrets
CREATE POLICY "Users can view own Solapi settings"
  ON user_solapi_secrets
  FOR SELECT
  USING (auth.uid()::bigint = user_id);

CREATE POLICY "Users can update own Solapi settings"
  ON user_solapi_secrets
  FOR UPDATE
  USING (auth.uid()::bigint = user_id);

CREATE POLICY "Users can insert own Solapi settings"
  ON user_solapi_secrets
  FOR INSERT
  WITH CHECK (auth.uid()::bigint = user_id);

CREATE POLICY "Users can delete own Solapi settings"
  ON user_solapi_secrets
  FOR DELETE
  USING (auth.uid()::bigint = user_id);

-- 4. Helper functions for encryption/decryption

-- Function to save Solapi settings (encrypts API keys)
CREATE OR REPLACE FUNCTION save_solapi_settings(
  p_user_id BIGINT,
  p_api_key TEXT,
  p_api_secret TEXT,
  p_sender_phone TEXT,
  p_kakao_sender_key TEXT DEFAULT NULL,
  p_template_id TEXT DEFAULT 'booking_link_v1'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_api_key_secret UUID;
  v_api_secret_secret UUID;
BEGIN
  -- Check if user owns this record
  IF auth.uid()::bigint != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Encrypt and store API key
  INSERT INTO vault.secrets (name, secret)
  VALUES (
    'solapi_api_key_' || p_user_id::text,
    p_api_key
  )
  ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret
  RETURNING id INTO v_api_key_secret;

  -- Encrypt and store API secret
  INSERT INTO vault.secrets (name, secret)
  VALUES (
    'solapi_api_secret_' || p_user_id::text,
    p_api_secret
  )
  ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret
  RETURNING id INTO v_api_secret_secret;

  -- Upsert user settings
  INSERT INTO user_solapi_secrets (
    user_id,
    api_key_secret,
    api_secret_secret,
    sender_phone,
    kakao_sender_key,
    template_id,
    is_active,
    updated_at
  )
  VALUES (
    p_user_id,
    v_api_key_secret,
    v_api_secret_secret,
    p_sender_phone,
    p_kakao_sender_key,
    p_template_id,
    true,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    api_key_secret = EXCLUDED.api_key_secret,
    api_secret_secret = EXCLUDED.api_secret_secret,
    sender_phone = EXCLUDED.sender_phone,
    kakao_sender_key = EXCLUDED.kakao_sender_key,
    template_id = EXCLUDED.template_id,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
END;
$$;

-- Function to get decrypted Solapi settings
CREATE OR REPLACE FUNCTION get_solapi_settings(p_user_id BIGINT)
RETURNS TABLE (
  api_key TEXT,
  api_secret TEXT,
  sender_phone TEXT,
  kakao_sender_key TEXT,
  template_id TEXT,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user owns this record
  IF auth.uid()::bigint != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    vault.decrypted_secret(s.api_key_secret)::TEXT as api_key,
    vault.decrypted_secret(s.api_secret_secret)::TEXT as api_secret,
    s.sender_phone,
    s.kakao_sender_key,
    s.template_id,
    s.is_active
  FROM user_solapi_secrets s
  WHERE s.user_id = p_user_id;
END;
$$;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_user_solapi_secrets_user_id ON user_solapi_secrets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_solapi_secrets_active ON user_solapi_secrets(is_active) WHERE is_active = true;

-- 6. Comments
COMMENT ON TABLE user_solapi_secrets IS '강사별 Solapi API 키 암호화 저장소 (Supabase Vault 사용)';
COMMENT ON FUNCTION save_solapi_settings IS 'Solapi API 키를 암호화하여 저장';
COMMENT ON FUNCTION get_solapi_settings IS 'Solapi API 키를 복호화하여 조회 (본인만 가능)';
