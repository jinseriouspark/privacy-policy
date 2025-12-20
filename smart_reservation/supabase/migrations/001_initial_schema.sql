-- 예약매니아 Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  picture TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('instructor', 'student')),
  username TEXT UNIQUE, -- For instructors only
  bio TEXT,
  access_token TEXT, -- Google Calendar access token (encrypted)
  token_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coachings table (강사의 코칭 상품)
CREATE TABLE IF NOT EXISTS coachings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- minutes
  price INTEGER, -- KRW
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Packages table (수강권)
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coaching_id UUID REFERENCES coachings(id),
  total_sessions INTEGER NOT NULL,
  remaining_sessions INTEGER NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coaching_id UUID REFERENCES coachings(id),
  package_id UUID REFERENCES packages(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'confirmed',
  google_event_id TEXT,
  meet_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table (강사별 설정)
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  calendar_id TEXT,
  timezone TEXT DEFAULT 'Asia/Seoul',
  business_hours JSONB, -- { "monday": [{"start": "09:00", "end": "18:00"}], ... }
  buffer_time INTEGER DEFAULT 0, -- minutes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_reservations_student ON reservations(student_id);
CREATE INDEX idx_reservations_instructor ON reservations(instructor_id);
CREATE INDEX idx_reservations_time ON reservations(start_time, end_time);
CREATE INDEX idx_packages_student ON packages(student_id);
CREATE INDEX idx_packages_instructor ON packages(instructor_id);
CREATE INDEX idx_coachings_instructor ON coachings(instructor_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE coachings ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read their own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "Anyone can read instructor profiles" ON users FOR SELECT USING (user_type = 'instructor');

-- Coachings policies
CREATE POLICY "Anyone can read active coachings" ON coachings FOR SELECT USING (is_active = true);
CREATE POLICY "Instructors can manage their coachings" ON coachings FOR ALL USING (auth.uid()::text = instructor_id::text);

-- Packages policies
CREATE POLICY "Students can read their own packages" ON packages FOR SELECT USING (auth.uid()::text = student_id::text);
CREATE POLICY "Instructors can read packages they issued" ON packages FOR SELECT USING (auth.uid()::text = instructor_id::text);
CREATE POLICY "Instructors can manage packages they issued" ON packages FOR ALL USING (auth.uid()::text = instructor_id::text);

-- Reservations policies
CREATE POLICY "Students can read their own reservations" ON reservations FOR SELECT USING (auth.uid()::text = student_id::text);
CREATE POLICY "Instructors can read their own reservations" ON reservations FOR SELECT USING (auth.uid()::text = instructor_id::text);
CREATE POLICY "Students can create reservations" ON reservations FOR INSERT WITH CHECK (auth.uid()::text = student_id::text);
CREATE POLICY "Students can cancel their own reservations" ON reservations FOR UPDATE USING (auth.uid()::text = student_id::text);
CREATE POLICY "Instructors can update their reservations" ON reservations FOR UPDATE USING (auth.uid()::text = instructor_id::text);

-- Settings policies
CREATE POLICY "Instructors can read their settings" ON settings FOR SELECT USING (auth.uid()::text = instructor_id::text);
CREATE POLICY "Instructors can manage their settings" ON settings FOR ALL USING (auth.uid()::text = instructor_id::text);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coachings_updated_at BEFORE UPDATE ON coachings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
