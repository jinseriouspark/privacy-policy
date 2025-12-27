# 서비스 테스트 체크리스트

> **목표**: 결제 시스템 붙이기 전에 기존 서비스가 정상 작동하는지 확인

**작성일**: 2025-12-25
**우선순위**: 🔴 최우선 (결제 전 필수)

---

## 📋 사전 준비

### 1. Supabase 마이그레이션 실행

다음 마이그레이션을 Supabase Dashboard에서 순서대로 실행:

- [ ] `024_user_roles_system.sql` - 역할 기반 시스템
- [ ] `025_update_pricing_for_instructors_only.sql` - 강사 전용 가격 정책
- [ ] `026_add_promo_codes.sql` - 프로모션 코드 시스템
- [ ] `027_add_lifetime_access.sql` - 평생 무료 이용

**실행 방법**:
```
1. https://supabase.com/dashboard/project/YOUR_PROJECT/editor
2. SQL Editor 열기
3. 각 마이그레이션 파일 내용 복사
4. 실행 (Run)
5. 에러 없이 완료되는지 확인
```

### 2. 환경 변수 확인

- [ ] `.env` 파일에 Supabase 키 설정 완료
- [ ] Supabase Redirect URLs 설정 완료
  - `https://yeyak-mania.co.kr`
  - `https://yeyak-mania.co.kr/**`
  - `http://localhost:5173` (로컬 테스트용)

---

## 🔐 인증 & 온보딩 테스트

### 로그인 플로우

#### 신규 사용자
- [ ] `/` (랜딩 페이지) 접속 가능
- [ ] "무료로 시작" 버튼 클릭 → `/login` 이동
- [ ] Google OAuth 로그인 버튼 표시
- [ ] Google 로그인 성공
- [ ] `/onboarding` 페이지로 자동 리다이렉트
- [ ] "강사로 시작하기" / "학생으로 시작하기" 버튼 표시

#### 강사 온보딩
- [ ] "강사로 시작하기" 클릭
- [ ] `/setup` (스튜디오 초기 설정) 페이지로 이동
- [ ] 스튜디오 이름 입력 가능
- [ ] URL (username) 입력 가능
- [ ] 전화번호 입력 가능
- [ ] "시작하기" 버튼 클릭 → 설정 저장
- [ ] `/summary` (통계 페이지) 로 자동 리다이렉트
- [ ] user_roles 테이블에 `instructor`, `student` 역할 둘 다 생성됨

**DB 확인 쿼리**:
```sql
SELECT ur.role FROM user_roles ur
JOIN users u ON ur.user_id = u.id
WHERE u.email = 'YOUR_EMAIL';
```

예상 결과:
```
role
----------
instructor
student
```

#### 학생 온보딩
- [ ] "학생으로 시작하기" 클릭
- [ ] `/dashboard` (학생 대시보드) 페이지로 이동
- [ ] user_roles 테이블에 `student` 역할만 생성됨

**DB 확인 쿼리**:
```sql
SELECT ur.role FROM user_roles ur
JOIN users u ON ur.user_id = u.id
WHERE u.email = 'STUDENT_EMAIL';
```

예상 결과:
```
role
------
student
```

#### 기존 사용자 (프로필 완성)
- [ ] 로그인 시 바로 대시보드로 이동
- [ ] 강사: `/summary` 페이지
- [ ] 학생: `/dashboard` 페이지

---

## 🎯 URL 라우팅 테스트

### 브라우저 네비게이션
- [ ] 브라우저 뒤로가기 버튼 동작
- [ ] 브라우저 앞으로가기 버튼 동작
- [ ] URL 직접 입력 후 Enter → 페이지 로드
- [ ] 새로고침 (F5) 후에도 같은 페이지 유지

### 북마크 & 공유
- [ ] URL 복사 → 새 탭에서 열기 → 같은 페이지 표시
- [ ] `/dashboard` 북마크 → 클릭 시 로그인 상태면 대시보드 표시
- [ ] 로그아웃 상태에서 `/dashboard` 접근 → `/login` 리다이렉트

### 동적 라우팅
- [ ] `/{coach_id}/{class_slug}` 형식 URL 접근 가능
- [ ] 존재하지 않는 coach_id → 404 또는 에러 처리
- [ ] 예약 페이지에서 예약 생성 후 URL 변경 없음

---

## 👨‍🏫 강사 기능 테스트

### 대시보드 (Desktop)
- [ ] `/summary` 접속 시 통계 대시보드 표시
- [ ] 7개 탭 모두 표시:
  - Stats (통계)
  - Reservations (예약 관리)
  - Group Classes (그룹 수업)
  - Attendance (출석)
  - Members (회원 관리)
  - Packages (수강권)
  - Settings (설정)
- [ ] 각 탭 클릭 시 콘텐츠 전환
- [ ] 헤더에 강사 이름 표시
- [ ] 로그아웃 버튼 동작

### 모바일 UI (iPhone/Android)
- [ ] 화면 너비 < 768px 일 때 모바일 UI 자동 전환
- [ ] Bottom Navigation 표시
- [ ] 5개 탭 아이콘 표시:
  - 홈 (📊)
  - 예약 (📅)
  - 학생 (👥)
  - 출석 (✓)
  - 프로필 (👤)
- [ ] 각 탭 클릭 시 페이지 전환
- [ ] Safe Area (iPhone 노치) 정상 처리
- [ ] Pull-to-Refresh 동작 (아래로 당기기)

### 코칭 클래스 생성
- [ ] 새 코칭 클래스 생성 버튼 존재
- [ ] 클래스 이름, 설명 입력 가능
- [ ] URL slug 자동 생성
- [ ] 저장 후 DB에 데이터 삽입 확인

**DB 확인 쿼리**:
```sql
SELECT * FROM coachings WHERE instructor_id = 'YOUR_USER_ID';
```

### 예약 관리
- [ ] 예약 목록 표시
- [ ] 예약 상태 변경 (대기 → 확정 → 완료)
- [ ] 예약 취소 기능
- [ ] 필터링 (날짜, 상태별)

### 학생 관리
- [ ] 학생 초대 링크 생성
- [ ] 초대 링크 복사 버튼
- [ ] 학생 목록 표시
- [ ] 학생별 수강권 현황 표시

### 수강권 관리
- [ ] 수강권 생성 (개인/그룹 선택)
- [ ] 수강권 편집
- [ ] 수강권 삭제
- [ ] 학생에게 수강권 할당

### 출석 체크
- [ ] 오늘 예약 목록 표시
- [ ] 출석/지각/결석 체크 가능
- [ ] 출석 상태 저장 후 DB 반영 확인

**DB 확인 쿼리**:
```sql
SELECT * FROM reservations WHERE attendance_status IS NOT NULL;
```

### 그룹 클래스
- [ ] 그룹 수업 일정 생성
- [ ] 정원 설정 기능
- [ ] 참가자 목록 표시
- [ ] 정원 초과 시 예약 차단

---

## 👨‍🎓 학생 기능 테스트

### 학생 대시보드
- [ ] `/dashboard` 접속 시 학생용 대시보드 표시
- [ ] 내 예약 목록 표시
- [ ] 예약 취소 버튼 동작
- [ ] 남은 수강권 횟수 표시

### 공개 예약 페이지
- [ ] 강사 프로필 링크 `/{coach_id}/{class_slug}` 접근 가능
- [ ] 강사 정보 표시 (이름, 사진, 소개)
- [ ] 예약 가능 시간 슬롯 표시
- [ ] 시간 선택 → 예약 생성
- [ ] 예약 성공 후 확인 메시지

### 수강권 사용
- [ ] 예약 시 수강권 자동 차감
- [ ] 수강권 0회 시 예약 불가 메시지
- [ ] 수강권 히스토리 조회

---

## 🔄 역할 시스템 테스트 (중요!)

### 강사이면서 학생인 경우

**시나리오**:
1. 사용자 A는 강사로 가입
2. 사용자 B도 강사로 가입
3. 사용자 A가 사용자 B의 클래스에 학생으로 예약

**테스트**:
- [ ] 강사 A가 강사 B의 예약 링크 접속 가능
- [ ] 강사 A가 예약 생성 가능 (학생 역할로)
- [ ] 강사 A의 대시보드에서 "내가 만든 예약" vs "내 학생의 예약" 구분 표시
- [ ] user_roles 테이블에 `instructor`, `student` 역할 모두 존재

**DB 확인**:
```sql
-- 강사 A의 역할 확인
SELECT role FROM user_roles WHERE user_id = 'A_USER_ID';

-- 강사 A가 다른 강사에게 만든 예약 확인
SELECT * FROM reservations
WHERE student_id = 'A_USER_ID'
AND coaching_id IN (SELECT id FROM coachings WHERE instructor_id != 'A_USER_ID');
```

---

## 📱 모바일 반응형 테스트

### Chrome DevTools
- [ ] F12 → Toggle Device Toolbar (Ctrl+Shift+M)
- [ ] iPhone SE (375px) 테스트
- [ ] iPhone 14 Pro (393px) 테스트
- [ ] iPad (768px) 테스트
- [ ] Galaxy S20 (360px) 테스트

### 체크 항목
- [ ] 텍스트가 잘리지 않음
- [ ] 버튼 터치 영역 충분 (최소 44x44px)
- [ ] 가로 스크롤 발생하지 않음
- [ ] 이미지 비율 유지
- [ ] 모바일에서 데스크톱 메뉴 숨김
- [ ] Bottom Navigation 고정 표시

---

## 🔒 권한 & 보안 테스트

### RLS (Row Level Security)
- [ ] 학생이 다른 학생의 예약 조회 불가
- [ ] 강사가 다른 강사의 학생 정보 조회 불가
- [ ] 본인이 만든 코칭만 수정 가능
- [ ] 타인의 프로필 수정 불가

**테스트 방법**:
1. 사용자 A로 로그인
2. 사용자 B의 ID를 알아낸 후
3. API 호출로 사용자 B 데이터 조회 시도
4. 에러 또는 빈 결과 반환 확인

### API 호출 제한
- [ ] 로그아웃 상태에서 API 호출 시 401 Unauthorized
- [ ] 잘못된 토큰으로 API 호출 시 거부
- [ ] SQL Injection 방어 (Supabase 자동 처리)

---

## 📊 구독 시스템 테스트 (결제 전)

### Free 플랜 제한
- [ ] 신규 강사 가입 시 자동으로 Free 플랜 할당
- [ ] Free 플랜: 1개 클래스, 10명 학생 제한
- [ ] 클래스 2개 생성 시도 → 제한 메시지
- [ ] 학생 11명 초대 시도 → 제한 메시지

**DB 확인**:
```sql
SELECT
  u.email,
  us.plan_id,
  sp.limits
FROM users u
JOIN user_subscriptions us ON u.id = us.user_id
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE u.email = 'YOUR_EMAIL';
```

예상 결과:
```
plan_id | limits
--------|--------------------------------------------
free    | {"max_students": 10, "max_coachings": 1}
```

### Standard 플랜 (수동 업그레이드)

**테스트를 위한 수동 업그레이드**:
```sql
UPDATE user_subscriptions
SET plan_id = 'standard'
WHERE user_id = 'YOUR_USER_ID' AND status = 'active';
```

- [ ] Standard 플랜 사용자: 5개 클래스 생성 가능
- [ ] Standard 플랜 사용자: 500명 학생 초대 가능
- [ ] 클래스 6개 생성 시도 → 제한 메시지
- [ ] 학생 501명 초대 시도 → 제한 메시지

---

## 🎁 프로모션 코드 테스트 (선택)

> **참고**: 결제 시스템 전에는 테스트만 가능. 실제 적용은 결제 연동 후.

### 코드 생성
- [ ] Supabase Dashboard에서 수동으로 프로모션 코드 생성

```sql
INSERT INTO promo_codes (code, description, discount_type, discount_value, plan_id, max_uses)
VALUES ('TEST2025', '테스트 코드', 'fixed_amount', 9000, 'standard', 1);
```

### 코드 검증
- [ ] `validate_promo_code()` 함수 호출

```sql
SELECT * FROM validate_promo_code('TEST2025', 'YOUR_USER_ID');
```

예상 결과:
```
is_valid | message              | discount_amount | final_price
---------|----------------------|-----------------|------------
true     | 프로모션 코드가 적용됨 | 9000           | 10000
```

### 이메일 화이트리스트
- [ ] 화이트리스트에 이메일 추가

```sql
INSERT INTO promo_email_whitelist (email, promo_code_id, note)
SELECT 'test@example.com', id, '테스트 사용자'
FROM promo_codes WHERE code = 'TEST2025';
```

- [ ] 로그인 시 자동 코드 표시 함수 테스트

```sql
SELECT auto_apply_promo_on_login('test@example.com', 'USER_ID');
```

예상 결과:
```
auto_apply_promo_on_login
-------------------------
TEST2025
```

---

## 🐛 에러 처리 테스트

### 네트워크 에러
- [ ] Chrome DevTools → Network → Offline 모드
- [ ] API 호출 시 에러 메시지 표시
- [ ] "인터넷 연결을 확인해주세요" 같은 친절한 메시지

### 404 페이지
- [ ] 존재하지 않는 URL 접속 (`/nonexistent`)
- [ ] 404 페이지 또는 랜딩 페이지로 리다이렉트

### DB 에러
- [ ] 유효하지 않은 데이터 입력 (빈 값, 너무 긴 텍스트)
- [ ] DB 제약 조건 위반 시 에러 핸들링
- [ ] 사용자에게 기술적 에러 메시지 노출 안 됨

---

## ✅ 완료 기준

모든 항목에 체크 완료 후:

1. **버그 목록 작성**
   - 발견된 모든 버그를 `BUGS.md` 파일에 기록
   - 우선순위 (Critical / High / Medium / Low) 표시

2. **성능 측정**
   - Lighthouse 점수 확인 (Performance, Accessibility, SEO)
   - 목표: Performance 90+, Accessibility 95+

3. **테스트 결과 보고**
   - CURRENT_TASK.md에 테스트 완료 기록
   - 주요 발견 사항 요약

4. **다음 단계 결정**
   - Critical 버그 수정
   - 결제 시스템 통합 준비

---

## 🚨 Critical Issues 즉시 보고

다음 문제 발견 시 즉시 작업 중단하고 보고:

- ❌ 로그인 불가
- ❌ 예약 생성 불가
- ❌ DB 데이터 삭제/손실
- ❌ 다른 사용자 데이터 접근 가능
- ❌ SQL Injection 가능
- ❌ XSS 공격 가능

---

**작성자**: Claude Code
**마지막 업데이트**: 2025-12-25
**다음 업데이트**: 테스트 완료 후
