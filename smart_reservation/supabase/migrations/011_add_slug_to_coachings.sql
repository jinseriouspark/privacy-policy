-- Simply add slug column to existing coachings table
ALTER TABLE coachings ADD COLUMN IF NOT EXISTS slug TEXT;

-- Add unique constraint
ALTER TABLE coachings DROP CONSTRAINT IF EXISTS coachings_slug_key;
ALTER TABLE coachings ADD CONSTRAINT coachings_slug_key UNIQUE (slug);

-- Create index
CREATE INDEX IF NOT EXISTS idx_coachings_slug ON coachings(slug);

-- Update existing rows with slugs based on title
UPDATE coachings 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9가-힣\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Make slug NOT NULL after populating
ALTER TABLE coachings ALTER COLUMN slug SET NOT NULL;

COMMENT ON COLUMN coachings.slug IS 'URL-friendly identifier for coaching (e.g., pilates-private)';
