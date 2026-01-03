-- Add Google Drive integration columns to settings table

-- Google Drive OAuth 토큰 및 설정
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS google_drive_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_drive_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_drive_token_expiry TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS google_drive_recordings_folder_id TEXT,
ADD COLUMN IF NOT EXISTS google_drive_watch_channel_id TEXT,
ADD COLUMN IF NOT EXISTS google_drive_watch_resource_id TEXT,
ADD COLUMN IF NOT EXISTS google_drive_watch_expiration TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS google_drive_connected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS google_drive_auto_sync BOOLEAN DEFAULT false;

-- 코치 업종 (AI 분석용)
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS coach_industry TEXT DEFAULT '기타';

-- Index for faster Google Drive lookups
CREATE INDEX IF NOT EXISTS idx_settings_google_drive_connected
ON settings(user_id, google_drive_access_token)
WHERE google_drive_access_token IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN settings.google_drive_access_token IS 'Google Drive OAuth access token';
COMMENT ON COLUMN settings.google_drive_refresh_token IS 'Google Drive OAuth refresh token';
COMMENT ON COLUMN settings.google_drive_recordings_folder_id IS 'Google Drive folder ID for Meet recordings';
COMMENT ON COLUMN settings.google_drive_watch_channel_id IS 'Google Drive Push notification channel ID';
COMMENT ON COLUMN settings.google_drive_auto_sync IS 'Automatically sync and analyze new recordings';
COMMENT ON COLUMN settings.coach_industry IS 'Coach industry type for AI analysis (필라테스, 요가, 피트니스, etc.)';
