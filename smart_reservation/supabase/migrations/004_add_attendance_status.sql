-- Add attendance_status column to reservations table
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS attendance_status TEXT CHECK (attendance_status IN ('attended', 'absent', 'late', 'pending'));

-- Set default value for existing records
UPDATE reservations SET attendance_status = 'pending' WHERE attendance_status IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_reservations_attendance_status ON reservations(attendance_status);
