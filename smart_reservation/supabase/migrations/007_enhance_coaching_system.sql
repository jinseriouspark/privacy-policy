-- Enhance coaching table with slug and additional fields
ALTER TABLE coaching ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE coaching ADD COLUMN IF NOT EXISTS google_calendar_id TEXT;
ALTER TABLE coaching ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE coaching ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Create slug constraint
ALTER TABLE coaching ADD CONSTRAINT valid_coaching_slug CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_coaching_slug ON coaching(slug);
CREATE INDEX IF NOT EXISTS idx_coaching_instructor ON coaching(instructor_id);
CREATE INDEX IF NOT EXISTS idx_coaching_status ON coaching(status);

-- Update invitations to use coaching_id instead of instructor_id
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS coaching_id UUID REFERENCES coaching(id) ON DELETE CASCADE;

-- Update invitations constraints (remove old, add new)
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS unique_instructor_email;
ALTER TABLE invitations ADD CONSTRAINT unique_coaching_email UNIQUE(coaching_id, email);

-- Add coaching_id index to invitations
CREATE INDEX IF NOT EXISTS idx_invitations_coaching ON invitations(coaching_id);

-- Update student_instructors to include coaching_id
ALTER TABLE student_instructors ADD COLUMN IF NOT EXISTS coaching_id UUID REFERENCES coaching(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_student_instructors_coaching ON student_instructors(coaching_id);

-- Update RLS policies for coaching
ALTER TABLE coaching ENABLE ROW LEVEL SECURITY;

-- Instructors can view their own coachings
DROP POLICY IF EXISTS "Instructors can view own coachings" ON coaching;
CREATE POLICY "Instructors can view own coachings"
  ON coaching FOR SELECT
  USING (instructor_id = auth.uid());

-- Instructors can create coachings
DROP POLICY IF EXISTS "Instructors can create coachings" ON coaching;
CREATE POLICY "Instructors can create coachings"
  ON coaching FOR INSERT
  WITH CHECK (instructor_id = auth.uid());

-- Instructors can update their own coachings
DROP POLICY IF EXISTS "Instructors can update own coachings" ON coaching;
CREATE POLICY "Instructors can update own coachings"
  ON coaching FOR UPDATE
  USING (instructor_id = auth.uid());

-- Instructors can delete their own coachings
DROP POLICY IF EXISTS "Instructors can delete own coachings" ON coaching;
CREATE POLICY "Instructors can delete own coachings"
  ON coaching FOR DELETE
  USING (instructor_id = auth.uid());

-- Anyone can view coachings by slug (for public booking)
DROP POLICY IF EXISTS "Anyone can view by slug" ON coaching;
CREATE POLICY "Anyone can view by slug"
  ON coaching FOR SELECT
  USING (true);

-- Update updated_at trigger for coaching
CREATE OR REPLACE FUNCTION update_coaching_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_coaching_updated_at_trigger ON coaching;
CREATE TRIGGER update_coaching_updated_at_trigger
  BEFORE UPDATE ON coaching
  FOR EACH ROW
  EXECUTE FUNCTION update_coaching_updated_at();
