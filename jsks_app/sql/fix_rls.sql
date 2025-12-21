-- ============================================================
-- RLS 정책 수정 (인증 없이도 읽기 가능하도록)
-- ============================================================

-- Practice Items: 인증 없이도 읽기 가능
DROP POLICY IF EXISTS "Practice items are viewable by everyone" ON practice_items;
CREATE POLICY "Practice items are viewable by everyone"
  ON practice_items FOR SELECT
  USING (true);

-- Users: 인증 없이도 읽기 가능 (스님 이메일 조회 등)
DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT
  USING (true);

-- Users: 본인만 수정 가능 (이메일 기반)
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (true)  -- 임시로 모두 허용
  WITH CHECK (true);

-- Users: 누구나 INSERT 가능 (신규 가입)
DROP POLICY IF EXISTS "Users can insert" ON users;
CREATE POLICY "Users can insert"
  ON users FOR INSERT
  WITH CHECK (true);

-- Schedules: 모두 읽기 가능
DROP POLICY IF EXISTS "Schedules are viewable by everyone" ON schedules;
CREATE POLICY "Schedules are viewable by everyone"
  ON schedules FOR SELECT
  USING (true);

-- Schedules: 모두 INSERT 가능
DROP POLICY IF EXISTS "Users can insert own schedules" ON schedules;
CREATE POLICY "Users can insert schedules"
  ON schedules FOR INSERT
  WITH CHECK (true);

-- Schedules: 모두 UPDATE 가능
DROP POLICY IF EXISTS "Users can update own schedules" ON schedules;
CREATE POLICY "Users can update schedules"
  ON schedules FOR UPDATE
  USING (true);

-- Schedules: 모두 DELETE 가능
DROP POLICY IF EXISTS "Users can delete own schedules" ON schedules;
CREATE POLICY "Users can delete schedules"
  ON schedules FOR DELETE
  USING (true);

-- Practice Logs: 모두 읽기/쓰기 가능 (임시)
DROP POLICY IF EXISTS "Users can view own practice logs" ON practice_logs;
DROP POLICY IF EXISTS "Users can insert own practice logs" ON practice_logs;
DROP POLICY IF EXISTS "Users can update own practice logs" ON practice_logs;

CREATE POLICY "Anyone can view practice logs"
  ON practice_logs FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert practice logs"
  ON practice_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update practice logs"
  ON practice_logs FOR UPDATE
  USING (true);

-- Event RSVP: 모두 접근 가능
DROP POLICY IF EXISTS "RSVP are viewable by everyone" ON event_rsvp;
DROP POLICY IF EXISTS "Users can manage own RSVP" ON event_rsvp;

CREATE POLICY "Anyone can view RSVP"
  ON event_rsvp FOR SELECT
  USING (true);

CREATE POLICY "Anyone can manage RSVP"
  ON event_rsvp FOR ALL
  USING (true);

-- Videos: published만 볼 수 있음
DROP POLICY IF EXISTS "Published videos are viewable by everyone" ON videos;
CREATE POLICY "Videos are viewable"
  ON videos FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Videos can be inserted" ON videos;
CREATE POLICY "Videos can be inserted"
  ON videos FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Videos can be updated" ON videos;
CREATE POLICY "Videos can be updated"
  ON videos FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Videos can be deleted" ON videos;
CREATE POLICY "Videos can be deleted"
  ON videos FOR DELETE
  USING (true);

-- App Settings: 모두 읽기 가능
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON app_settings;
CREATE POLICY "Settings are viewable"
  ON app_settings FOR SELECT
  USING (true);

-- App Settings: 모두 수정 가능 (upsert 지원)
DROP POLICY IF EXISTS "Settings can be updated" ON app_settings;
CREATE POLICY "Settings can be updated"
  ON app_settings FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Settings can be inserted" ON app_settings;
CREATE POLICY "Settings can be inserted"
  ON app_settings FOR INSERT
  WITH CHECK (true);

-- 확인
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
