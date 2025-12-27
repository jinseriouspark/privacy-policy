# 마이그레이션 실행 순서

> **중요**: Supabase Dashboard에서 순서대로 실행하세요!

## 📋 실행 순서

### 1. Migration 024: User Roles System ✅
```bash
supabase/migrations/024_user_roles_system.sql
```
**내용**: 역할 기반 시스템 (강사이면서 학생 가능)
- `user_roles` 테이블 생성
- Helper functions: `get_user_roles()`, `has_role()`, etc.

---

### 2. Migration 025: Update Pricing (수정됨) ✅
```bash
supabase/migrations/025_update_pricing_for_instructors_only.sql
```
**내용**: 강사 전용 구독 플랜
- Free: 1개 클래스, 10명 학생
- Standard: 5개 클래스, 500명 학생 (₩19,000/월)
- **수정사항**: `instructor_students` → `packages` 테이블 사용

**주의**: 기존 `subscription_plans` 데이터 삭제 후 재생성

---

### 3. Migration 026: Promo Codes (수정됨) ✅
```bash
supabase/migrations/026_add_promo_codes.sql
```
**내용**: 프로모션 코드 시스템
- `promo_codes`, `promo_code_usage`, `promo_email_whitelist` 테이블
- Helper functions: `validate_promo_code()`, `apply_promo_code()`
- **수정사항**: 모든 인덱스에 `IF NOT EXISTS` 추가

**예시 코드**:
- `MASTERMIND2025`: ₩9,000 할인
- `EARLYBIRD`: 50% 할인
- `FRIENDS`: 30% 할인

---

### 4. Migration 027: Lifetime Access ✅
```bash
supabase/migrations/027_add_lifetime_access.sql
```
**내용**: VIP 사용자 평생 무료 이용
- `users.lifetime_access` 컬럼 추가
- Helper functions: `grant_lifetime_access()`, `has_lifetime_access()`

**사용 예시**:
```sql
SELECT grant_lifetime_access('USER_UUID', '마스터마인드 창립 멤버');
```

---

### 5. Migration 028: Package Templates (수정됨) ✅
```bash
supabase/migrations/028_add_package_templates.sql
```
**내용**: 코칭당 여러 수강권 템플릿 지원
- `package_templates` 테이블 생성
- `packages.package_template_id`, `packages.name` 컬럼 추가
- **수정사항**: `update_updated_at_column()` 함수 자동 생성 추가

**구조**:
```
코칭: "피아노 레슨"
├─ 체험 3회권 (₩50,000, 30일)
├─ 월간 10회권 (₩150,000, 30일)
└─ 연간 120회권 (₩1,620,000, 365일)
```

---

## 🔧 실행 방법

### Supabase Dashboard에서 실행

1. https://supabase.com/dashboard 접속
2. 프로젝트 선택
3. **SQL Editor** 클릭
4. **New query** 생성
5. 각 마이그레이션 파일 내용을 복사해서 붙여넣기
6. **Run** 버튼 클릭
7. 에러 없이 완료되면 다음 마이그레이션 진행

### 로컬 Supabase CLI (선택)

```bash
# 1. Supabase CLI 설치
npm install -g supabase

# 2. 프로젝트 링크
supabase link --project-ref YOUR_PROJECT_ID

# 3. 마이그레이션 실행
supabase db push
```

---

## ✅ 검증 쿼리

### 1. User Roles 확인
```sql
SELECT
  u.email,
  ARRAY_AGG(ur.role) as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
GROUP BY u.id, u.email;
```

### 2. Subscription Plans 확인
```sql
SELECT
  sp.display_name,
  sp.monthly_price,
  COUNT(us.id) as user_count
FROM subscription_plans sp
LEFT JOIN user_subscriptions us ON sp.id = us.plan_id AND us.status = 'active'
GROUP BY sp.id, sp.display_name
ORDER BY sp.monthly_price;
```

### 3. Promo Codes 확인
```sql
SELECT code, description, discount_type, discount_value, max_uses, current_uses
FROM promo_codes
WHERE is_active = true;
```

### 4. Lifetime Access 확인
```sql
SELECT email, name, lifetime_access_note
FROM users
WHERE lifetime_access = true;
```

### 5. Package Templates 확인
```sql
SELECT
  c.title as coaching,
  pt.name as template_name,
  pt.total_sessions,
  pt.validity_days,
  pt.price
FROM package_templates pt
JOIN coachings c ON pt.coaching_id = c.id
WHERE pt.is_active = true
ORDER BY c.title, pt.display_order;
```

---

## 🐛 문제 해결

### "relation already exists" 에러
→ 정상입니다. `IF NOT EXISTS`가 있어서 무시됩니다.

### "function does not exist" 에러
→ Migration 028이 `update_updated_at_column()` 함수를 자동 생성합니다.

### "instructor_students does not exist" 에러
→ Migration 025를 수정된 버전으로 다시 실행하세요.

### 트랜잭션 에러
→ 각 마이그레이션을 개별적으로 실행하세요 (한 번에 전체 실행 금지).

---

## 📊 실행 후 확인 사항

- [ ] `user_roles` 테이블 생성됨
- [ ] 강사들에게 Free 플랜 자동 할당됨
- [ ] `promo_codes` 3개 생성됨 (MASTERMIND2025, EARLYBIRD, FRIENDS)
- [ ] `package_templates` 테이블 생성됨
- [ ] `packages.package_template_id` 컬럼 추가됨
- [ ] 모든 검증 쿼리가 에러 없이 실행됨

---

**작성일**: 2025-12-25
**마지막 업데이트**: 2025-12-25 (Migration 025, 026, 028 수정)
