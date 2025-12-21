-- Create invitations table for student invites
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invitation_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,

  CONSTRAINT unique_instructor_email UNIQUE(instructor_id, email)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_invitations_instructor ON invitations(instructor_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- Add RLS policies
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Instructors can view their own invitations
CREATE POLICY "Instructors can view own invitations"
  ON invitations FOR SELECT
  USING (instructor_id = auth.uid());

-- Instructors can create invitations
CREATE POLICY "Instructors can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (instructor_id = auth.uid());

-- Instructors can update their own invitations
CREATE POLICY "Instructors can update own invitations"
  ON invitations FOR UPDATE
  USING (instructor_id = auth.uid());

-- Anyone can view invitation by code (for validation)
CREATE POLICY "Anyone can view by invitation code"
  ON invitations FOR SELECT
  USING (true);

-- Add student-instructor relationship table
CREATE TABLE IF NOT EXISTS student_instructors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_student_instructor UNIQUE(student_id, instructor_id)
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_student_instructors_student ON student_instructors(student_id);
CREATE INDEX IF NOT EXISTS idx_student_instructors_instructor ON student_instructors(instructor_id);

-- Add RLS policies for student_instructors
ALTER TABLE student_instructors ENABLE ROW LEVEL SECURITY;

-- Students can view their own relationships
CREATE POLICY "Students can view own relationships"
  ON student_instructors FOR SELECT
  USING (student_id = auth.uid());

-- Instructors can view their own relationships
CREATE POLICY "Instructors can view their students"
  ON student_instructors FOR SELECT
  USING (instructor_id = auth.uid());

-- Anyone can create relationships (when accepting invite)
CREATE POLICY "Anyone can create relationships"
  ON student_instructors FOR INSERT
  WITH CHECK (true);
