-- Add working_hours column to coachings table
-- Stores weekly working hours as JSONB
-- Format: { "0": { "start": "09:00", "end": "18:00", "isWorking": true }, ... }

ALTER TABLE coachings
ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN coachings.working_hours IS 'Weekly working hours by day (0=Sunday, 6=Saturday)';

-- Example data format:
-- {
--   "0": { "start": "09:00", "end": "18:00", "isWorking": false },
--   "1": { "start": "09:00", "end": "18:00", "isWorking": true },
--   "2": { "start": "09:00", "end": "18:00", "isWorking": true },
--   ...
-- }
