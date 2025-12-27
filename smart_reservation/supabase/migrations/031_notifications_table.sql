-- Migration: Notifications Table
-- Purpose: Create notifications table for student alerts and messaging
-- Date: 2025-12-26

-- =====================================================
-- CREATE NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'booking_confirmed',
    'booking_cancelled',
    'class_reminder',
    'package_expiring',
    'instructor_message'
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  package_id UUID REFERENCES student_packages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Index for querying user's notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications(user_id)
  WHERE deleted_at IS NULL;

-- Index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications(user_id, is_read)
  WHERE deleted_at IS NULL AND is_read = FALSE;

-- Index for notification type queries
CREATE INDEX IF NOT EXISTS idx_notifications_type
  ON notifications(user_id, type)
  WHERE deleted_at IS NULL;

-- Index for created_at ordering
CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON notifications(created_at DESC)
  WHERE deleted_at IS NULL;

-- =====================================================
-- AUTO-UPDATE TRIGGER
-- =====================================================

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Students can view their own notifications
CREATE POLICY "Students can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Students can update their own notifications (mark as read)
CREATE POLICY "Students can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Students can soft-delete their own notifications
CREATE POLICY "Students can soft-delete their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND deleted_at IS NOT NULL);

-- Instructors can create notifications for their students
CREATE POLICY "Instructors can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = user_id
      AND user_type = 'student'
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to create booking confirmation notification
CREATE OR REPLACE FUNCTION create_booking_notification(
  p_user_id INTEGER,
  p_reservation_id UUID,
  p_start_time TIMESTAMPTZ
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    reservation_id
  ) VALUES (
    p_user_id,
    'booking_confirmed',
    '예약이 확정되었습니다',
    format('수업이 %s에 예약되었습니다.',
      to_char(p_start_time AT TIME ZONE 'Asia/Seoul', 'YYYY년 MM월 DD일 HH24:MI')
    ),
    p_reservation_id
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create class reminder notification
CREATE OR REPLACE FUNCTION create_class_reminder_notification(
  p_user_id INTEGER,
  p_reservation_id UUID,
  p_start_time TIMESTAMPTZ,
  p_minutes_before INTEGER
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_message TEXT;
BEGIN
  IF p_minutes_before >= 1440 THEN
    v_message := '내일 수업이 있습니다.';
  ELSIF p_minutes_before >= 60 THEN
    v_message := format('%s시간 후 수업이 시작됩니다.', (p_minutes_before / 60)::INTEGER);
  ELSE
    v_message := format('%s분 후 수업이 시작됩니다.', p_minutes_before);
  END IF;

  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    reservation_id
  ) VALUES (
    p_user_id,
    'class_reminder',
    '수업 알림',
    v_message,
    p_reservation_id
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create package expiring notification
CREATE OR REPLACE FUNCTION create_package_expiring_notification(
  p_user_id INTEGER,
  p_package_id UUID,
  p_days_left INTEGER
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    package_id
  ) VALUES (
    p_user_id,
    'package_expiring',
    '수강권 만료 예정',
    format('수강권이 %s일 후 만료됩니다. 빠른 예약을 권장합니다!', p_days_left),
    p_package_id
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- AUTO-NOTIFICATION TRIGGERS
-- =====================================================

-- Trigger to auto-create notification when reservation is created
CREATE OR REPLACE FUNCTION trigger_booking_notification() RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if status is confirmed
  IF NEW.status = 'confirmed' THEN
    PERFORM create_booking_notification(
      NEW.student_id,
      NEW.id,
      NEW.start_time
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_booking_notification
  AFTER INSERT ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_booking_notification();

-- Trigger to create cancellation notification
CREATE OR REPLACE FUNCTION trigger_cancellation_notification() RETURNS TRIGGER AS $$
BEGIN
  -- Only if status changed to cancelled
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      reservation_id
    ) VALUES (
      NEW.student_id,
      'booking_cancelled',
      '예약이 취소되었습니다',
      format('수업(%s)이 취소되었습니다.',
        to_char(NEW.start_time AT TIME ZONE 'Asia/Seoul', 'MM월 DD일 HH24:MI')
      ),
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_cancellation_notification
  AFTER UPDATE ON reservations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_cancellation_notification();

-- =====================================================
-- SCHEDULED JOBS (Requires pg_cron extension)
-- =====================================================

-- Note: These would need to be set up separately via Supabase dashboard
-- or using pg_cron extension

-- Example: Send reminders 1 day before class
-- SELECT cron.schedule('class-reminder-1day', '0 9 * * *', $$
--   SELECT create_class_reminder_notification(
--     r.student_id,
--     r.id,
--     r.start_time,
--     1440
--   )
--   FROM reservations r
--   WHERE r.start_time::DATE = (CURRENT_DATE + INTERVAL '1 day')
--     AND r.status = 'confirmed'
--     AND r.deleted_at IS NULL;
-- $$);

-- Example: Send package expiring warnings (7 days, 3 days, 1 day)
-- SELECT cron.schedule('package-expiring-check', '0 10 * * *', $$
--   SELECT create_package_expiring_notification(
--     sp.student_id,
--     sp.id,
--     (sp.valid_until::DATE - CURRENT_DATE)::INTEGER
--   )
--   FROM student_packages sp
--   WHERE sp.status = 'active'
--     AND sp.valid_until::DATE IN (
--       CURRENT_DATE + INTERVAL '7 days',
--       CURRENT_DATE + INTERVAL '3 days',
--       CURRENT_DATE + INTERVAL '1 day'
--     )
--     AND sp.deleted_at IS NULL;
-- $$);

COMMENT ON TABLE notifications IS 'User notifications for booking confirmations, reminders, and messages';
COMMENT ON COLUMN notifications.type IS 'Notification type: booking_confirmed, booking_cancelled, class_reminder, package_expiring, instructor_message';
COMMENT ON COLUMN notifications.is_read IS 'Whether the notification has been read by the user';
COMMENT ON FUNCTION create_booking_notification IS 'Creates a booking confirmation notification';
COMMENT ON FUNCTION create_class_reminder_notification IS 'Creates a class reminder notification';
COMMENT ON FUNCTION create_package_expiring_notification IS 'Creates a package expiring notification';
