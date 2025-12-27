-- ============================================================================
-- COMPLETE DATABASE SCHEMA FOR SMART RESERVATION
-- ============================================================================
-- Generated: 2025-12-26
-- Based on: Frontend code analysis (database.ts, types.ts, components)
-- ID Type: BIGINT (BIGSERIAL for auto-increment primary keys)
-- ============================================================================

-- Drop all existing tables (if needed for clean install)
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS group_classes CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS student_instructors CASCADE;
DROP TABLE IF EXISTS promo_email_whitelist CASCADE;
DROP TABLE IF EXISTS promo_code_usage CASCADE;
DROP TABLE IF EXISTS promo_codes CASCADE;
DROP TABLE IF EXISTS package_templates CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS coachings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- TABLE 1: users
-- ============================================================================
-- Purpose: Core user table for both instructors and students
-- Used by: All major components (Login, Signup, Dashboard, etc.)
-- ============================================================================

CREATE TABLE users (
  -- Primary Key
  id BIGSERIAL PRIMARY KEY,

  -- Core User Info
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  picture TEXT,                         -- Google profile picture URL
  bio TEXT,                             -- Instructor bio (used in PublicBooking)
  phone TEXT,                           -- Contact number

  -- URL & Identity
  username TEXT UNIQUE,                 -- For public booking links (deprecated, use short_id)
  short_id TEXT UNIQUE NOT NULL,        -- 10-char ID for URLs (e.g., /abc123xyz/class-name)

  -- Studio Info (for instructors)
  studio_name TEXT,                     -- Studio/business name
  studio_url TEXT UNIQUE,               -- Custom studio URL (deprecated)

  -- Flags
  is_profile_complete BOOLEAN DEFAULT false,   -- Has completed onboarding
  lifetime_access BOOLEAN NOT NULL DEFAULT false,  -- Lifetime free access flag
  lifetime_access_note TEXT,            -- Note explaining why lifetime access granted

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_short_id ON users(short_id);
CREATE INDEX idx_users_studio_url ON users(studio_url);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_lifetime_access ON users(lifetime_access);

-- Comments
COMMENT ON TABLE users IS 'Core user table supporting both instructors and students';
COMMENT ON COLUMN users.short_id IS 'Short 10-character alphanumeric ID for user-friendly URLs (e.g., /abc123xyz/pilates)';
COMMENT ON COLUMN users.lifetime_access IS 'True for users with permanent free access (beta testers, friends, etc.)';

-- ============================================================================
-- TABLE 2: user_roles
-- ============================================================================
-- Purpose: Multi-role system - users can be both instructor AND student
-- Used by: roles.ts, database.ts (getUserRoles, getPrimaryRole)
-- ============================================================================

CREATE TABLE user_roles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('instructor', 'student')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, role)  -- A user can't have the same role twice
);

-- Indexes
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- Comments
COMMENT ON TABLE user_roles IS 'Role-based access control - users can have multiple roles (e.g., instructor taking another class)';
COMMENT ON COLUMN user_roles.role IS 'Either "instructor" (can teach) or "student" (can book)';

-- ============================================================================
-- TABLE 3: subscription_plans
-- ============================================================================
-- Purpose: Pricing tiers (Free, Standard, Teams, Enterprise)
-- Used by: PricingPage.tsx, subscriptions.ts
-- ============================================================================

CREATE TABLE subscription_plans (
  -- Primary Key (text-based: 'free', 'standard', 'teams', 'enterprise')
  id TEXT PRIMARY KEY,

  -- Display Info
  name TEXT NOT NULL,                   -- Internal name
  display_name TEXT NOT NULL,           -- Public-facing name
  description TEXT,                     -- Marketing description

  -- Pricing
  monthly_price INTEGER NOT NULL DEFAULT 0,   -- Price in KRW (19000 = ₩19,000)
  yearly_price INTEGER NOT NULL DEFAULT 0,    -- Yearly price in KRW

  -- Features & Limits (JSON)
  features JSONB NOT NULL DEFAULT '{}',       -- {"group_classes": true, "statistics": true, ...}
  limits JSONB NOT NULL DEFAULT '{}',         -- {"max_students": 500, "max_coachings": 5}

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Data
INSERT INTO subscription_plans (id, name, display_name, description, monthly_price, yearly_price, features, limits) VALUES
('free', 'free', 'Free', '개인 강사를 위한 시작 플랜', 0, 0,
 '{"private_reservations": true, "group_classes": true, "attendance_check": true, "statistics": true}'::jsonb,
 '{"max_students": 10, "max_coachings": 1}'::jsonb),
('standard', 'standard', 'Standard', '성장하는 강사를 위한 필수 플랜', 19000, 190000,
 '{"private_reservations": true, "group_classes": true, "attendance_check": true, "statistics": true, "priority_support": true}'::jsonb,
 '{"max_students": 500, "max_coachings": 5}'::jsonb),
('teams', 'teams', 'Teams', '준비 중', 0, 0,
 '{"coming_soon": true}'::jsonb, '{}'::jsonb),
('enterprise', 'enterprise', 'Enterprise', '준비 중', 0, 0,
 '{"coming_soon": true}'::jsonb, '{}'::jsonb);

-- Comments
COMMENT ON TABLE subscription_plans IS 'Available subscription tiers with features and pricing';
COMMENT ON COLUMN subscription_plans.features IS 'JSON object of feature flags (e.g., {"group_classes": true})';
COMMENT ON COLUMN subscription_plans.limits IS 'JSON object of usage limits (e.g., {"max_students": 500})';

-- ============================================================================
-- TABLE 4: user_subscriptions
-- ============================================================================
-- Purpose: Active subscription for each user
-- Used by: subscriptions.ts (getCurrentSubscription, getPlanLimits)
-- ============================================================================

CREATE TABLE user_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id),

  -- Billing Info
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')) DEFAULT 'monthly',

  -- Status & Timing
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')) DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, status)  -- A user can only have one active subscription
);

-- Indexes
CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);

-- Comments
COMMENT ON TABLE user_subscriptions IS 'Active subscription status for each user';

-- ============================================================================
-- TABLE 5: coachings
-- ============================================================================
-- Purpose: Coaching classes (e.g., "Pilates Private", "Yoga Group")
-- Used by: CoachingManagementInline.tsx, PublicBooking.tsx, database.ts
-- Note: Each coaching can have its own Google Calendar
-- ============================================================================

CREATE TABLE coachings (
  id BIGSERIAL PRIMARY KEY,
  instructor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Class Info
  title TEXT NOT NULL,                  -- e.g., "Pilates Private"
  slug TEXT NOT NULL,                   -- URL slug (e.g., "pilates-private")
  description TEXT,                     -- Long description

  -- Type & Settings
  type TEXT NOT NULL DEFAULT 'private' CHECK (type IN ('private', 'group')),
  duration INTEGER NOT NULL DEFAULT 60,  -- Duration in minutes
  price INTEGER DEFAULT 0,               -- Price per session in KRW

  -- Google Calendar Integration
  google_calendar_id TEXT,              -- Per-coaching Google Calendar ID

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  is_active BOOLEAN DEFAULT TRUE,       -- Active flag (alternative to status)

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_coachings_instructor ON coachings(instructor_id);
CREATE INDEX idx_coachings_slug ON coachings(slug);
CREATE INDEX idx_coachings_status ON coachings(status);
CREATE INDEX idx_coachings_instructor_slug ON coachings(instructor_id, slug);  -- For /{coach_id}/{slug}

-- Comments
COMMENT ON TABLE coachings IS 'Coaching classes - each can have separate calendar and settings';
COMMENT ON COLUMN coachings.slug IS 'URL-friendly slug, unique per instructor (e.g., pilates-private)';
COMMENT ON COLUMN coachings.google_calendar_id IS 'Separate Google Calendar for this coaching (per-coaching architecture)';

-- ============================================================================
-- TABLE 6: package_templates
-- ============================================================================
-- Purpose: Reusable package templates (e.g., "10회 수강권")
-- Used by: PackageManagement.tsx, database.ts (getClassPackages)
-- ============================================================================

CREATE TABLE package_templates (
  id BIGSERIAL PRIMARY KEY,
  coaching_id BIGINT REFERENCES coachings(id) ON DELETE CASCADE,
  instructor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Package Info
  name TEXT NOT NULL,                   -- e.g., "10회 수강권"
  description TEXT,

  -- Sessions & Validity
  total_sessions INTEGER,               -- Number of sessions (null for time-based)
  validity_days INTEGER NOT NULL,       -- Valid for N days

  -- Pricing
  price INTEGER NOT NULL,               -- Price in KRW

  -- Type
  type TEXT NOT NULL CHECK (type IN ('session_based', 'time_based', 'unlimited')) DEFAULT 'session_based',

  -- Display
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_package_templates_coaching ON package_templates(coaching_id);
CREATE INDEX idx_package_templates_instructor ON package_templates(instructor_id);

-- Comments
COMMENT ON TABLE package_templates IS 'Reusable package templates that instructors create';

-- ============================================================================
-- TABLE 7: packages
-- ============================================================================
-- Purpose: Actual purchased packages (student's credits)
-- Used by: database.ts (createPackage, getStudentPackages, deductPackageCredit)
-- ============================================================================

CREATE TABLE packages (
  id BIGSERIAL PRIMARY KEY,

  -- Ownership
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instructor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coaching_id BIGINT REFERENCES coachings(id) ON DELETE SET NULL,
  package_template_id BIGINT REFERENCES package_templates(id) ON DELETE SET NULL,

  -- Package Details
  name TEXT,                            -- Package name (copied from template)
  total_sessions INTEGER NOT NULL,      -- Original number of sessions
  remaining_sessions INTEGER NOT NULL,  -- Sessions left

  -- Validity
  start_date DATE DEFAULT CURRENT_DATE, -- When package was purchased
  expires_at TIMESTAMPTZ,               -- Expiration date

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_packages_student ON packages(student_id);
CREATE INDEX idx_packages_instructor ON packages(instructor_id);
CREATE INDEX idx_packages_coaching ON packages(coaching_id);
CREATE INDEX idx_packages_student_instructor ON packages(student_id, instructor_id);

-- Comments
COMMENT ON TABLE packages IS 'Purchased packages - actual credits owned by students';
COMMENT ON COLUMN packages.remaining_sessions IS 'Decremented when booking reservations';

-- ============================================================================
-- TABLE 8: reservations
-- ============================================================================
-- Purpose: Booking reservations (both private and group)
-- Used by: Reservation.tsx, database.ts (createReservation, getReservations)
-- ============================================================================

CREATE TABLE reservations (
  id BIGSERIAL PRIMARY KEY,

  -- Participants
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instructor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coaching_id BIGINT REFERENCES coachings(id) ON DELETE SET NULL,
  package_id BIGINT REFERENCES packages(id) ON DELETE SET NULL,

  -- Timing
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,

  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'scheduled')) DEFAULT 'confirmed',
  attendance_status TEXT CHECK (attendance_status IN ('pending', 'attended', 'present', 'absent', 'late')),

  -- Google Integration
  google_event_id TEXT,                 -- Google Calendar event ID
  meet_link TEXT,                       -- Google Meet link (auto-generated)

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reservations_student ON reservations(student_id);
CREATE INDEX idx_reservations_instructor ON reservations(instructor_id);
CREATE INDEX idx_reservations_coaching ON reservations(coaching_id);
CREATE INDEX idx_reservations_start_time ON reservations(start_time);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_attendance ON reservations(attendance_status);
CREATE INDEX idx_reservations_instructor_time ON reservations(instructor_id, start_time);

-- Comments
COMMENT ON TABLE reservations IS 'Booking reservations for both private and group classes';
COMMENT ON COLUMN reservations.attendance_status IS 'Used by AttendanceCheck.tsx component';

-- ============================================================================
-- TABLE 9: invitations
-- ============================================================================
-- Purpose: Student invitation system (6-digit codes)
-- Used by: StudentInviteModal.tsx, database.ts (createInvitation, acceptInvitation)
-- ============================================================================

CREATE TABLE invitations (
  id BIGSERIAL PRIMARY KEY,
  instructor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coaching_id BIGINT REFERENCES coachings(id) ON DELETE CASCADE,

  -- Invitation Info
  email TEXT NOT NULL,                  -- Student email to invite
  invitation_code TEXT NOT NULL UNIQUE, -- 6-character code (e.g., "A3K9T2")

  -- Status & Timing
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,

  CONSTRAINT unique_instructor_coaching_email UNIQUE(instructor_id, coaching_id, email)
);

-- Indexes
CREATE INDEX idx_invitations_code ON invitations(invitation_code);
CREATE INDEX idx_invitations_instructor ON invitations(instructor_id);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_coaching ON invitations(coaching_id);

-- Comments
COMMENT ON TABLE invitations IS 'Student invitation system with 6-digit codes';

-- ============================================================================
-- TABLE 10: student_instructors
-- ============================================================================
-- Purpose: Student-instructor relationships (who teaches whom)
-- Used by: database.ts (getInstructorStudents, acceptInvitation)
-- ============================================================================

CREATE TABLE student_instructors (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instructor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coaching_id BIGINT REFERENCES coachings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(student_id, instructor_id, coaching_id)
);

-- Indexes
CREATE INDEX idx_student_instructors_student ON student_instructors(student_id);
CREATE INDEX idx_student_instructors_instructor ON student_instructors(instructor_id);
CREATE INDEX idx_student_instructors_coaching ON student_instructors(coaching_id);

-- Comments
COMMENT ON TABLE student_instructors IS 'Tracks student-instructor relationships per coaching';

-- ============================================================================
-- TABLE 11: settings
-- ============================================================================
-- Purpose: Instructor settings (calendar, timezone, working hours)
-- Used by: database.ts (getInstructorSettings, upsertInstructorSettings)
-- Note: Deprecated in favor of per-coaching settings
-- ============================================================================

CREATE TABLE settings (
  id BIGSERIAL PRIMARY KEY,
  instructor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  google_calendar_id TEXT,
  timezone TEXT DEFAULT 'Asia/Seoul',
  business_hours JSONB,
  buffer_time INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_settings_instructor ON settings(instructor_id);

-- Comments
COMMENT ON TABLE settings IS 'Instructor settings for calendar and working hours';
COMMENT ON COLUMN settings.business_hours IS 'JSON object with day index (0-6) mapping to start/end times and isWorking flag';

-- ============================================================================
-- TABLE 12: group_classes
-- ============================================================================
-- Purpose: Group class sessions (scheduled events with capacity)
-- Used by: GroupClassSchedule.tsx, database.ts (getGroupSessions)
-- ============================================================================

CREATE TABLE group_classes (
  id BIGSERIAL PRIMARY KEY,
  instructor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Class Info
  title TEXT NOT NULL,

  -- Scheduling
  date DATE NOT NULL,
  time TIME NOT NULL,

  -- Type & Capacity
  type TEXT NOT NULL DEFAULT 'group',
  max_capacity INTEGER NOT NULL DEFAULT 6,
  current_count INTEGER NOT NULL DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_group_classes_instructor ON group_classes(instructor_id);
CREATE INDEX idx_group_classes_date ON group_classes(date);
CREATE INDEX idx_group_classes_status ON group_classes(status);
CREATE INDEX idx_group_classes_upcoming ON group_classes(instructor_id, date, time) WHERE status = 'scheduled';

-- Comments
COMMENT ON TABLE group_classes IS 'Group class sessions with capacity management';

-- ============================================================================
-- TABLE 13: activity_logs
-- ============================================================================
-- Purpose: User activity tracking for analytics
-- Used by: database.ts (logActivity, getUserActivityStats)
-- ============================================================================

CREATE TABLE activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Action Info
  action TEXT NOT NULL,                 -- 'view_tab', 'create_coaching', 'invite_student', etc.
  tab_name TEXT,                        -- 'dashboard', 'packages', 'group_classes', 'attendance', 'stats'

  -- Additional Context
  metadata JSONB,                       -- Extra data (JSON)

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_tab_name ON activity_logs(tab_name);
CREATE INDEX idx_activity_logs_user_action ON activity_logs(user_id, action, created_at DESC);

-- Comments
COMMENT ON TABLE activity_logs IS 'User behavior tracking for product analytics';

-- ============================================================================
-- TABLE 14: promo_codes
-- ============================================================================
-- Purpose: Promotional discount codes
-- Used by: subscriptions.ts (validatePromoCode)
-- ============================================================================

CREATE TABLE promo_codes (
  id BIGSERIAL PRIMARY KEY,

  -- Code Info
  code TEXT NOT NULL UNIQUE,            -- e.g., "EARLYBIRD", "FRIENDS"
  description TEXT,

  -- Discount
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value INTEGER NOT NULL,      -- 50 (for 50%) or 9000 (for ₩9,000 off)

  -- Restrictions
  plan_id TEXT REFERENCES subscription_plans(id),  -- Apply only to specific plan
  max_uses INTEGER,                     -- Maximum number of uses (null = unlimited)
  current_uses INTEGER NOT NULL DEFAULT 0,

  -- Validity
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,              -- null = never expires
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_active ON promo_codes(is_active);

-- Seed Data
INSERT INTO promo_codes (code, description, discount_type, discount_value, plan_id, valid_until) VALUES
('MASTERMIND2025', '마스터마인드 할인', 'fixed_amount', 9000, 'standard', '2025-12-31 23:59:59+09'),
('EARLYBIRD', '얼리버드 50%', 'percentage', 50, 'standard', '2025-03-31 23:59:59+09'),
('FRIENDS', '지인 초대 30%', 'percentage', 30, 'standard', NULL);

-- Comments
COMMENT ON TABLE promo_codes IS 'Promotional discount codes for subscriptions';

-- ============================================================================
-- TABLE 15: promo_code_usage
-- ============================================================================
-- Purpose: Track which users used which promo codes
-- Used by: subscriptions.ts
-- ============================================================================

CREATE TABLE promo_code_usage (
  id BIGSERIAL PRIMARY KEY,
  promo_code_id BIGINT NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id BIGINT REFERENCES user_subscriptions(id),
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(promo_code_id, user_id)  -- A user can only use a code once
);

-- Indexes
CREATE INDEX idx_promo_code_usage_user ON promo_code_usage(user_id);
CREATE INDEX idx_promo_code_usage_code ON promo_code_usage(promo_code_id);

-- Comments
COMMENT ON TABLE promo_code_usage IS 'Tracks promo code redemptions';

-- ============================================================================
-- TABLE 16: promo_email_whitelist
-- ============================================================================
-- Purpose: Auto-apply promo codes for specific emails (VIP list)
-- Used by: subscriptions.ts
-- ============================================================================

CREATE TABLE promo_email_whitelist (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  promo_code_id BIGINT REFERENCES promo_codes(id) ON DELETE SET NULL,
  auto_apply BOOLEAN NOT NULL DEFAULT true,
  note TEXT,                            -- Reason for whitelisting
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_promo_email_whitelist_email ON promo_email_whitelist(email);

-- Comments
COMMENT ON TABLE promo_email_whitelist IS 'VIP email list with auto-applied promo codes';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coachings_updated_at
  BEFORE UPDATE ON coachings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_package_templates_updated_at
  BEFORE UPDATE ON package_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_classes_updated_at
  BEFORE UPDATE ON group_classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate short_id function
CREATE OR REPLACE FUNCTION generate_short_id()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..10 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate short_id for new users
CREATE OR REPLACE FUNCTION auto_generate_short_id()
RETURNS TRIGGER AS $$
DECLARE
  new_short_id TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  IF NEW.short_id IS NULL THEN
    LOOP
      new_short_id := generate_short_id();

      IF NOT EXISTS (SELECT 1 FROM users WHERE short_id = new_short_id) THEN
        NEW.short_id := new_short_id;
        EXIT;
      END IF;

      attempt := attempt + 1;
      IF attempt >= max_attempts THEN
        RAISE EXCEPTION 'Failed to generate unique short_id after % attempts', max_attempts;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_short_id
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_short_id();

-- User role helper functions
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id BIGINT)
RETURNS TEXT[] AS $$
  SELECT ARRAY_AGG(role) FROM user_roles WHERE user_id = p_user_id;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION has_role(p_user_id BIGINT, p_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = p_role);
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_primary_role(p_user_id BIGINT)
RETURNS TEXT AS $$
  SELECT CASE
    WHEN has_role(p_user_id, 'instructor') THEN 'instructor'
    WHEN has_role(p_user_id, 'student') THEN 'student'
    ELSE NULL
  END;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Note: Using auth.jwt()->>'email' for Supabase Auth integration
-- ============================================================================

-- Users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (email = auth.jwt()->>'email');

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (email = auth.jwt()->>'email');

-- User Roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own roles"
  ON user_roles FOR ALL
  USING (
    user_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

-- Subscription Plans (public read)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans FOR SELECT
  USING (true);

-- User Subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscriptions"
  ON user_subscriptions FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

-- Coachings
ALTER TABLE coachings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors manage own coachings"
  ON coachings FOR ALL
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Anyone can view active coachings"
  ON coachings FOR SELECT
  USING (status = 'active');

-- Package Templates
ALTER TABLE package_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors manage own templates"
  ON package_templates FOR ALL
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Anyone can view active templates"
  ON package_templates FOR SELECT
  USING (is_active = true);

-- Packages
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage own packages"
  ON packages FOR ALL
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
    OR student_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

-- Reservations
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage own reservations"
  ON reservations FOR ALL
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
    OR student_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

-- Invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors manage own invitations"
  ON invitations FOR ALL
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Anyone can view by invitation code"
  ON invitations FOR SELECT
  USING (true);

-- Student-Instructor Relationships
ALTER TABLE student_instructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own relationships"
  ON student_instructors FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Instructors view own relationships"
  ON student_instructors FOR SELECT
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Anyone can create relationships"
  ON student_instructors FOR INSERT
  WITH CHECK (true);

-- Settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors manage own settings"
  ON settings FOR ALL
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

-- Group Classes
ALTER TABLE group_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors manage own group classes"
  ON group_classes FOR ALL
  USING (
    instructor_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Anyone can view group classes"
  ON group_classes FOR SELECT
  USING (true);

-- Activity Logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Users view own activity logs"
  ON activity_logs FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

-- Promo Codes (public read)
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promo codes"
  ON promo_codes FOR SELECT
  USING (is_active = true);

-- Promo Code Usage
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own promo usage"
  ON promo_code_usage FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE email = auth.jwt()->>'email'
    )
  );

-- Promo Email Whitelist (public read)
ALTER TABLE promo_email_whitelist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view whitelist"
  ON promo_email_whitelist FOR SELECT
  USING (true);

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Count columns per table
SELECT
  table_name,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;

-- ============================================================================
-- SCHEMA SUMMARY
-- ============================================================================
-- Total Tables: 16
--
-- Core Tables (8):
--   1. users - User accounts (instructors & students)
--   2. user_roles - Role-based access control
--   3. coachings - Coaching classes
--   4. packages - Student credits/sessions
--   5. reservations - Bookings
--   6. package_templates - Reusable package templates
--   7. student_instructors - Relationships
--   8. invitations - Student invite codes
--
-- Subscription System (5):
--   9. subscription_plans - Pricing tiers
--  10. user_subscriptions - Active subscriptions
--  11. promo_codes - Discount codes
--  12. promo_code_usage - Redemption tracking
--  13. promo_email_whitelist - VIP emails
--
-- Supporting Tables (3):
--  14. settings - Instructor settings
--  15. group_classes - Group sessions
--  16. activity_logs - Analytics
--
-- Key Features:
--  - BIGINT IDs throughout
--  - Per-coaching Google Calendar support
--  - Multi-role system (user can be both instructor & student)
--  - Promo code system with whitelisting
--  - Row Level Security (RLS) enabled
--  - Automatic timestamp updates
--  - Short IDs for user-friendly URLs
-- ============================================================================
