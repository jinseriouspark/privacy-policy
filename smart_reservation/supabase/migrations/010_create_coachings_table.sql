-- Create coachings table if it doesn't exist
CREATE TABLE IF NOT EXISTS coachings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'private' CHECK (type IN ('private', 'group')),
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 60,
  price INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  google_calendar_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coachings_slug ON coachings(slug);
CREATE INDEX IF NOT EXISTS idx_coachings_instructor ON coachings(instructor_id);
CREATE INDEX IF NOT EXISTS idx_coachings_status ON coachings(status);

-- Enable RLS
ALTER TABLE coachings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Instructors can view own coachings" ON coachings;
CREATE POLICY "Instructors can view own coachings"
  ON coachings FOR SELECT
  USING (instructor_id = auth.uid());

DROP POLICY IF EXISTS "Instructors can create coachings" ON coachings;
CREATE POLICY "Instructors can create coachings"
  ON coachings FOR INSERT
  WITH CHECK (instructor_id = auth.uid());

DROP POLICY IF EXISTS "Instructors can update own coachings" ON coachings;
CREATE POLICY "Instructors can update own coachings"
  ON coachings FOR UPDATE
  USING (instructor_id = auth.uid());

DROP POLICY IF EXISTS "Instructors can delete own coachings" ON coachings;
CREATE POLICY "Instructors can delete own coachings"
  ON coachings FOR DELETE
  USING (instructor_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view by slug" ON coachings;
CREATE POLICY "Anyone can view by slug"
  ON coachings FOR SELECT
  USING (true);

-- Update invitations to use coaching_id
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS coaching_id UUID REFERENCES coachings(id) ON DELETE CASCADE;
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS unique_instructor_email;
ALTER TABLE invitations ADD CONSTRAINT unique_coaching_email UNIQUE(coaching_id, email);
CREATE INDEX IF NOT EXISTS idx_invitations_coaching ON invitations(coaching_id);

-- Update student_instructors to include coaching_id
ALTER TABLE student_instructors ADD COLUMN IF NOT EXISTS coaching_id UUID REFERENCES coachings(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_student_instructors_coaching ON student_instructors(coaching_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_coachings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_coachings_updated_at_trigger ON coachings;
CREATE TRIGGER update_coachings_updated_at_trigger
  BEFORE UPDATE ON coachings
  FOR EACH ROW
  EXECUTE FUNCTION update_coachings_updated_at();

COMMENT ON TABLE coachings IS 'Coaching/class offerings by instructors with unique slugs for booking URLs';
