-- ============================================================
-- Supabase DB Schema for 법륜사 수행 앱
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. Users (사용자)
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('monk', 'believer')),
  photo_url TEXT,
  dharma_name TEXT,
  tracking_ids TEXT[], -- Array of practice item IDs
  notification_settings JSONB DEFAULT '{}',
  streak INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- 2. Practice Items (수행 항목 마스터)
-- ============================================================
CREATE TABLE practice_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_practice_items_order ON practice_items("order");
CREATE INDEX idx_practice_items_category ON practice_items(category);

-- ============================================================
-- 3. Practice Logs (수행 기록)
-- ============================================================
CREATE TABLE practice_logs (
  id TEXT PRIMARY KEY, -- format: email_YYYY-MM-DD
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  date DATE NOT NULL,
  progress INTEGER NOT NULL CHECK (progress >= 0 AND progress <= 100),
  checked_ids TEXT[], -- Array of checked practice item IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email, date)
);

CREATE INDEX idx_practice_logs_user ON practice_logs(user_id);
CREATE INDEX idx_practice_logs_email ON practice_logs(email);
CREATE INDEX idx_practice_logs_date ON practice_logs(date);

-- ============================================================
-- 4. Schedules (일정)
-- ============================================================
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('temple', 'personal', 'group')),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  end_date DATE,
  end_time TEXT,
  location TEXT,
  meta TEXT,
  attachment_url TEXT,
  owner_email TEXT NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  max_participants INTEGER DEFAULT 0,
  invited_emails TEXT[], -- Array of invited user emails
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_schedules_date ON schedules(date);
CREATE INDEX idx_schedules_owner ON schedules(owner_email);
CREATE INDEX idx_schedules_type ON schedules(type);

-- ============================================================
-- 5. Event RSVP (이벤트 참석 신청)
-- ============================================================
CREATE TABLE event_rsvp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('joined', 'cancelled')),
  rsvp_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(schedule_id, user_email)
);

CREATE INDEX idx_event_rsvp_schedule ON event_rsvp(schedule_id);
CREATE INDEX idx_event_rsvp_user ON event_rsvp(user_email);

-- ============================================================
-- 6. Videos (법문 영상)
-- ============================================================
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  duration TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  tags TEXT[],
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_published ON videos(published_at);

-- ============================================================
-- 7. App Settings (앱 설정)
-- ============================================================
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Triggers (자동 updated_at 업데이트)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practice_logs_updated_at BEFORE UPDATE ON practice_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Users: 본인 데이터만 수정 가능, 모두 읽기 가능
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.jwt() ->> 'email' = email);

-- Practice Items: 모두 읽기 가능, 스님만 수정
ALTER TABLE practice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practice items are viewable by everyone"
  ON practice_items FOR SELECT
  USING (true);

-- Practice Logs: 본인 데이터만 읽기/쓰기
ALTER TABLE practice_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own practice logs"
  ON practice_logs FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Users can insert own practice logs"
  ON practice_logs FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = email);

CREATE POLICY "Users can update own practice logs"
  ON practice_logs FOR UPDATE
  USING (auth.jwt() ->> 'email' = email);

-- Schedules: 모두 읽기, 본인/스님만 수정
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schedules are viewable by everyone"
  ON schedules FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own schedules"
  ON schedules FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = owner_email);

CREATE POLICY "Users can update own schedules"
  ON schedules FOR UPDATE
  USING (auth.jwt() ->> 'email' = owner_email);

CREATE POLICY "Users can delete own schedules"
  ON schedules FOR DELETE
  USING (auth.jwt() ->> 'email' = owner_email);

-- Event RSVP: 모두 읽기, 본인 RSVP만 쓰기
ALTER TABLE event_rsvp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RSVP are viewable by everyone"
  ON event_rsvp FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own RSVP"
  ON event_rsvp FOR ALL
  USING (auth.jwt() ->> 'email' = user_email);

-- Videos: 모두 읽기, 스님만 수정
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published videos are viewable by everyone"
  ON videos FOR SELECT
  USING (status = 'published' OR auth.jwt() ->> 'role' = 'monk');

-- App Settings: 모두 읽기, 스님만 수정
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings are viewable by everyone"
  ON app_settings FOR SELECT
  USING (true);

-- ============================================================
-- Initial Data (필수 수행 항목)
-- ============================================================
INSERT INTO practice_items (id, category, question, "order") VALUES
  -- 필수 항목
  ('1', '필수', '경전읽기', 1),
  ('2', '필수', '염불/참선', 2),
  -- 정견·공관
  ('3', '정견·공관', '나/사물에 대한 집착을 자각했는가?', 3),
  ('4', '정견·공관', '모든것이 인연따라 이루어 짐을 떠올렸는가?', 4),
  ('5', '정견·공관', '공을 허무가 아닌 관계로 체험했는가?', 5),
  -- 보리심
  ('6', '보리심', '하루 시작 하기 전 발원을 했는가?', 6),
  ('7', '보리심', '힘들 때도 발원을 상기했는가?', 7),
  ('8', '보리심', '성과를 내 것이라 집착하지 않았는가?', 8),
  -- 육바라밀
  ('9', '보시', '재물·말·지혜의 보시를 실천했는가?', 9),
  ('10', '지계', '타인에게 해를 끼치지 않았는가?', 10),
  ('11', '인욕', '분노 대신 알아차림을 유지했는가?', 11),
  ('12', '정진', '수행·학습·봉사를 게을리하지 않았는가?', 12),
  ('13', '선정', '좌선·호흡관을 실천했는가?', 13),
  ('14', '반야', '바라밀을 공관과 연결했는가?', 14),
  -- 방편·자비
  ('15', '방편·자비', '상대의 상황에 맞춰 말했는가?', 15),
  ('16', '방편·자비', '옳고 그름보다 이익을 우선했는가?', 16),
  ('17', '방편·자비', '행위 후 집착이 남지 않았는가?', 17),
  -- 두 진리
  ('18', '두 진리', '세속제에서 도덕·규범을 지켰는가?', 18),
  ('19', '두 진리', '승의제에서 무자성을 기억했는가?', 19),
  ('20', '두 진리', '두 진리를 균형 있게 적용했는가?', 20),
  -- 무주열반
  ('21', '무주열반', '열반에 집착하지 않았는가?', 21),
  ('22', '무주열반', '득실에 매이지 않았는가?', 22),
  ('23', '무주열반', '머물 곳 없음의 태도를 적용했는가?', 23),
  -- 자기 성찰
  ('24', '자기 성찰', '집착 패턴을 기록했는가?', 24),
  ('25', '자기 성찰', '마음비움과 자비가 서로를 보완했는가?', 25);
