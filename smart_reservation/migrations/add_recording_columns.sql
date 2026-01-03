-- Add recording and transcription columns to reservations table

-- Google Drive 녹화 파일 정보
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS recording_drive_id TEXT,
ADD COLUMN IF NOT EXISTS recording_url TEXT,
ADD COLUMN IF NOT EXISTS transcript_drive_id TEXT,
ADD COLUMN IF NOT EXISTS transcript_text TEXT,
ADD COLUMN IF NOT EXISTS ai_analysis TEXT,
ADD COLUMN IF NOT EXISTS recording_processed_at TIMESTAMPTZ;

-- Index for faster recording lookups
CREATE INDEX IF NOT EXISTS idx_reservations_recording
ON reservations(instructor_id, recording_drive_id)
WHERE recording_drive_id IS NOT NULL;

-- Comments
COMMENT ON COLUMN reservations.recording_drive_id IS 'Google Drive file ID for Meet recording (.mp4)';
COMMENT ON COLUMN reservations.recording_url IS 'Shareable Google Drive link for recording';
COMMENT ON COLUMN reservations.transcript_drive_id IS 'Google Drive file ID for transcript (.vtt)';
COMMENT ON COLUMN reservations.transcript_text IS 'Full transcription text from .vtt file';
COMMENT ON COLUMN reservations.ai_analysis IS 'Gemini AI analysis of the lesson (based on transcript)';
COMMENT ON COLUMN reservations.recording_processed_at IS 'Timestamp when recording was processed and analyzed';
