-- Create activity_logs table for user behavior tracking
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,  -- 'view_tab', 'create_coaching', 'invite_student', etc.
  tab_name TEXT,  -- 'dashboard', 'packages', 'group_classes', 'attendance', 'stats'
  metadata JSONB,  -- Additional context data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_tab_name ON activity_logs(tab_name);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own activity logs"
  ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own activity logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin can view all logs (for analytics)
CREATE POLICY "Admins can view all activity logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email IN ('chat.together.alone@gmail.com')  -- Admin emails
    )
  );

COMMENT ON TABLE activity_logs IS 'User activity tracking for behavior analytics and product improvement';
