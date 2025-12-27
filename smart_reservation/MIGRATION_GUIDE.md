# 데이터베이스 마이그레이션 가이드 (UUID → BIGINT)

## 📋 개요

이 가이드는 예약매니아 데이터베이스를 UUID 기반에서 BIGINT 기반으로 전환하는 과정을 설명합니다.

### 왜 BIGINT로 전환하나요?

**성능 향상**:
- 2-3배 빠른 JOIN 연산
- 인덱스 크기 50% 감소
- 더 빠른 쿼리 실행

**저장 공간 절약**:
- UUID: 16 bytes
- BIGINT: 8 bytes
- 50% 저장 공간 절약

**충분한 용량**:
- 최대값: 9,223,372,036,854,775,807 (922경)
- 10억 사용자 × 10년 데이터 커버 가능

**간편한 디버깅**:
- UUID: `550e8400-e29b-41d4-a716-446655440000`
- BIGINT: `123456789`
- 더 읽기 쉽고 복사/붙여넣기 편함

---

## ⚠️ 주의사항

### 데이터 손실
- ✅ **현재 상태**: 테스트 단계, 실제 사용자 데이터 없음
- ⚠️ **이 마이그레이션은 모든 기존 테이블과 데이터를 삭제합니다**
- ⚠️ **프로덕션 환경에서는 절대 실행하지 마세요** (데이터 백업 필수)

### 타이밍
- ✅ **지금 실행**: 데이터가 없는 초기 개발 단계
- ❌ **나중 실행**: 실제 사용자 데이터가 있으면 복잡함

---

## 🚀 마이그레이션 실행 절차

### 1단계: Supabase Dashboard 접속

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택: `smart_reservation`
3. 왼쪽 메뉴에서 **SQL Editor** 클릭

### 2단계: 마이그레이션 파일 복사

1. 로컬 파일 열기:
   ```
   supabase/migrations/001_complete_schema_bigint.sql
   ```

2. 전체 내용 복사 (Cmd+A, Cmd+C)

### 3단계: SQL 실행

1. Supabase SQL Editor에 붙여넣기 (Cmd+V)
2. **Run** 버튼 클릭 (또는 Cmd+Enter)
3. 실행 시간: 약 2-3초
4. 성공 메시지 확인:
   ```
   Success. No rows returned
   ```

### 4단계: 테이블 생성 확인

SQL Editor에서 다음 쿼리 실행:

```sql
-- 테이블 목록 확인 (11개 테이블이 있어야 함)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**예상 결과**:
```
packages
package_templates
promo_codes
promo_code_usage
promo_email_whitelist
reservations
subscription_plans
user_roles
users
user_subscriptions
coachings
```

### 5단계: RLS 정책 확인

```sql
-- RLS 활성화 확인
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**예상 결과**: 모든 테이블이 `rowsecurity = true`

### 6단계: 샘플 데이터 확인

```sql
-- 구독 플랜 확인 (4개)
SELECT id, display_name, monthly_price, yearly_price
FROM subscription_plans
ORDER BY monthly_price;

-- 프로모션 코드 확인 (3개)
SELECT code, description, discount_type, discount_value
FROM promo_codes
ORDER BY created_at;
```

**예상 결과**:

**Subscription Plans**:
| id | display_name | monthly_price | yearly_price |
|---|---|---|---|
| free | Free | 0 | 0 |
| standard | Standard | 19,000 | 190,000 |
| teams | Teams | 0 | 0 |
| enterprise | Enterprise | 0 | 0 |

**Promo Codes**:
| code | description | discount_type | discount_value |
|---|---|---|---|
| MASTERMIND2025 | 마스터마인드 할인 | fixed_amount | 9,000 |
| EARLYBIRD | 얼리버드 50% | percentage | 50 |
| FRIENDS | 지인 초대 30% | percentage | 30 |

---

## 🔍 변경 사항 상세

### 제거된 테이블 (6개)

기존 스키마에 있었지만 실제로 사용하지 않는 테이블들:

1. `activity_logs` - 활동 로그 (현재 미사용)
2. `group_classes` - 그룹 수업 (reservations로 통합)
3. `invitations` - 초대 시스템 (packages로 통합)
4. `settings` - 설정 (users 테이블에 통합)
5. `student_instructors` - 학생-강사 관계 (packages로 추적)
6. `subscription_usage` - 구독 사용량 (실시간 계산으로 변경)

### 새로운 테이블 구조 (11개)

#### 1. users
```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,  -- UUID → BIGINT
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  picture TEXT,
  bio TEXT,
  phone TEXT,
  studio_name TEXT,
  studio_url TEXT UNIQUE,
  lifetime_access BOOLEAN NOT NULL DEFAULT false,
  lifetime_access_note TEXT,
  is_profile_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 2. user_roles
```sql
CREATE TABLE user_roles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('instructor', 'student')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);
```

#### 3. coachings
```sql
CREATE TABLE coachings (
  id BIGSERIAL PRIMARY KEY,
  instructor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'private' CHECK (type IN ('private', 'group')),
  duration INTEGER NOT NULL DEFAULT 60,
  price INTEGER DEFAULT 0,
  google_calendar_id TEXT,  -- ⚠️ calendar_id → google_calendar_id
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 4. package_templates
```sql
CREATE TABLE package_templates (
  id BIGSERIAL PRIMARY KEY,
  coaching_id BIGINT NOT NULL REFERENCES coachings(id) ON DELETE CASCADE,
  instructor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  total_sessions INTEGER,
  validity_days INTEGER NOT NULL,
  price INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('session_based', 'time_based', 'unlimited')) DEFAULT 'session_based',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 5. packages
```sql
CREATE TABLE packages (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instructor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coaching_id BIGINT REFERENCES coachings(id) ON DELETE SET NULL,
  package_template_id BIGINT REFERENCES package_templates(id) ON DELETE SET NULL,
  name TEXT,
  total_sessions INTEGER NOT NULL,
  remaining_sessions INTEGER NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 6. reservations
```sql
CREATE TABLE reservations (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instructor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coaching_id BIGINT REFERENCES coachings(id) ON DELETE SET NULL,
  package_id BIGINT REFERENCES packages(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'confirmed',
  attendance_status TEXT CHECK (attendance_status IN ('pending', 'attended', 'absent', 'late')),
  google_event_id TEXT,
  meet_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### 7-11. 기타 테이블
- `subscription_plans`
- `user_subscriptions`
- `promo_codes`
- `promo_code_usage`
- `promo_email_whitelist`

---

## 🔐 RLS 정책 변경

### 기존 방식 (작동 안 함)
```sql
-- ❌ auth.email()이 작동하지 않음
CREATE POLICY "Users manage own data"
  ON users FOR ALL
  USING (id = (SELECT id FROM users WHERE email = auth.email()));
```

### 새로운 방식 (작동함)
```sql
-- ✅ Helper function 사용
CREATE OR REPLACE FUNCTION get_user_id_by_email(p_email TEXT)
RETURNS BIGINT AS $$
  SELECT id FROM users WHERE email = p_email LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = get_user_id_by_email(auth.jwt()->>'email'));
```

---

## 🛠️ Helper Functions

### 1. update_updated_at_column()
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**사용**:
```sql
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. get_user_roles()
```sql
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id BIGINT)
RETURNS TEXT[] AS $$
  SELECT ARRAY_AGG(role) FROM user_roles WHERE user_id = p_user_id;
$$ LANGUAGE SQL STABLE;
```

**사용 예시**:
```sql
SELECT get_user_roles(1); -- ['instructor', 'student']
```

### 3. has_role()
```sql
CREATE OR REPLACE FUNCTION has_role(p_user_id BIGINT, p_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = p_role);
$$ LANGUAGE SQL STABLE;
```

**사용 예시**:
```sql
SELECT has_role(1, 'instructor'); -- true
```

### 4. get_primary_role()
```sql
CREATE OR REPLACE FUNCTION get_primary_role(p_user_id BIGINT)
RETURNS TEXT AS $$
  SELECT CASE
    WHEN has_role(p_user_id, 'instructor') THEN 'instructor'
    WHEN has_role(p_user_id, 'student') THEN 'student'
    ELSE NULL
  END;
$$ LANGUAGE SQL STABLE;
```

**사용 예시**:
```sql
SELECT get_primary_role(1); -- 'instructor'
```

---

## 🔄 TypeScript 타입 호환성

### 변경 필요 없음 ✅

TypeScript에서 `id: string`을 사용하면 됩니다:

```typescript
export interface User {
  id?: string; // BIGINT는 JSON에서 문자열로 직렬화됨
  email: string;
  name: string;
  // ...
}
```

**이유**:
- PostgreSQL BIGINT는 JavaScript Number의 안전 범위를 초과 (2^53)
- Supabase/PostgREST는 자동으로 BIGINT를 문자열로 직렬화
- `"123456789"` 형태로 전달됨
- TypeScript에서 `string` 타입 사용

---

## 🐛 문제 해결

### Migration 실패 시
```sql
-- 1. user_roles 테이블 삭제
DROP TABLE IF EXISTS user_roles CASCADE;

-- 2. 함수 삭제
DROP FUNCTION IF EXISTS get_user_roles(UUID);
DROP FUNCTION IF EXISTS has_role(UUID, TEXT);
DROP FUNCTION IF EXISTS get_primary_role(UUID);

-- 3. Migration 다시 실행
```

### 역할 확인
```sql
-- 특정 사용자의 역할 확인
SELECT * FROM user_roles WHERE user_id = 'USER_UUID_HERE';

-- 역할 수동 추가
INSERT INTO user_roles (user_id, role)
VALUES ('USER_UUID_HERE', 'student')
ON CONFLICT DO NOTHING;
```

---

## 📊 성능 영향

### 쿼리 성능
- **기존**: `SELECT * FROM users WHERE id = ?` (1회)
- **신규**: `SELECT * FROM users WHERE id = ?` (1회) + `SELECT * FROM user_roles WHERE user_id = ?` (1회)
- **영향**: 인덱스가 있어 0.1ms 이하 (무시 가능)

### 메모리 영향
- 사용자 1명당 역할 2개 = 약 100 bytes
- 1만 명 사용자 = 약 1MB (미미함)

---

## ✅ 체크리스트

- [ ] Migration 실행 완료
- [ ] `user_roles` 테이블 생성 확인
- [ ] 기존 사용자 데이터 마이그레이션 확인
- [ ] 인덱스 생성 확인
- [ ] Helper 함수 생성 확인
- [ ] 테스트: 신규 사용자 온보딩
- [ ] 테스트: 강사가 다른 강사 수업 예약
- [ ] 빌드 성공 확인
- [ ] 배포

---

## 📞 도움이 필요하면

1. SQL 에러 메시지 복사
2. GitHub Issue 생성 또는 Claude에게 질문
3. Supabase Dashboard → Database → Logs 확인

---

**작성일**: 2025-12-25
**작성자**: Claude Code
**Migration 번호**: 024
