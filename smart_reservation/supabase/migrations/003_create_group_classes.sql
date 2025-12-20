-- Create group_classes table
CREATE TABLE IF NOT EXISTS group_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  type TEXT NOT NULL DEFAULT 'group',
  max_capacity INTEGER NOT NULL DEFAULT 6,
  current_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_group_classes_instructor ON group_classes(instructor_id);
CREATE INDEX IF NOT EXISTS idx_group_classes_date ON group_classes(date);
CREATE INDEX IF NOT EXISTS idx_group_classes_status ON group_classes(status);

-- Enable RLS
ALTER TABLE group_classes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Instructors can view their own group classes"
  ON group_classes FOR SELECT
  USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors can create their own group classes"
  ON group_classes FOR INSERT
  WITH CHECK (auth.uid() = instructor_id);

CREATE POLICY "Instructors can update their own group classes"
  ON group_classes FOR UPDATE
  USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors can delete their own group classes"
  ON group_classes FOR DELETE
  USING (auth.uid() = instructor_id);

-- Students can view all group classes (for booking)
CREATE POLICY "Students can view all group classes"
  ON group_classes FOR SELECT
  USING (true);
