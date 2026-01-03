-- Migration: Add Notion integration columns to settings table
-- Created: 2025-12-31
-- Purpose: Enable Notion OAuth integration for lesson notes

-- Add Notion OAuth columns to existing settings table
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS notion_access_token TEXT,
ADD COLUMN IF NOT EXISTS notion_workspace_name TEXT,
ADD COLUMN IF NOT EXISTS notion_workspace_icon TEXT,
ADD COLUMN IF NOT EXISTS notion_bot_id TEXT,
ADD COLUMN IF NOT EXISTS notion_database_id TEXT,
ADD COLUMN IF NOT EXISTS notion_connected_at TIMESTAMPTZ;

-- Add linked calendars for busy time sync (if not exists)
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS linked_calendars TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS busy_times_cache JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Add webhook columns for Make.com integration
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

-- Add index for faster Notion lookups
CREATE INDEX IF NOT EXISTS idx_settings_notion_connected
ON settings(instructor_id, notion_access_token)
WHERE notion_access_token IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN settings.notion_access_token IS 'Notion OAuth access token (TODO: Should be encrypted)';
COMMENT ON COLUMN settings.notion_workspace_name IS 'Connected Notion workspace name';
COMMENT ON COLUMN settings.notion_database_id IS 'Notion database ID for lesson notes';
COMMENT ON COLUMN settings.notion_connected_at IS 'Timestamp when Notion was connected';
COMMENT ON COLUMN settings.linked_calendars IS 'Array of Google Calendar IDs for busy time sync';
COMMENT ON COLUMN settings.busy_times_cache IS 'Cached busy times from linked calendars (1 hour expiry)';
COMMENT ON COLUMN settings.webhook_url IS 'Make.com webhook URL for automation triggers';

-- Verify the migration
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'settings'
AND (column_name LIKE 'notion%' OR column_name LIKE 'webhook%' OR column_name IN ('linked_calendars', 'busy_times_cache', 'last_synced_at'))
ORDER BY ordinal_position;
