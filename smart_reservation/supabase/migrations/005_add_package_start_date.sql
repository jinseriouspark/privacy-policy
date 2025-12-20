-- Add start_date and name to packages table
ALTER TABLE packages ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE packages ADD COLUMN IF NOT EXISTS name TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_packages_expires_at ON packages(expires_at);
CREATE INDEX IF NOT EXISTS idx_packages_start_date ON packages(start_date);
