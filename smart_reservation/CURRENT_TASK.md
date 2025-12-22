# 현재 작업 목록

## 작업 완료 보고 (2025-12-19)

### ✅ 완료된 작업

#### Phase 1: 계정 관리 시스템 (Calendly 스타일)
- ✅ **사용자 타입 시스템 추가** (types.ts)
  - UserType enum 추가 (STUDENT, INSTRUCTOR)
  - User interface 확장 (userType, username, bio, isProfileComplete, studioName, phone, packages)
  - ClassType enum 추가 (PRIVATE, GROUP)
  - ClassPackage, ClassSession 인터페이스 추가
  - Reservation에 출석 상태 추가

- ✅ **회원가입 페이지 구현** (components/Signup.tsx)
  - 계정 유형 선택 (강사/학생)
  - 강사용 프로필 설정 (username, bio)
  - 학생은 즉시 가입 완료
  - Google OAuth 통합

- ✅ **강사 프로필 설정 페이지** (components/InstructorProfile.tsx)
  - 프로필 정보 편집 (이름, username, 소개)
  - 예약 링크 생성 및 복사 기능
  - 공개 예약 페이지 URL 미리보기

- ✅ **Login 컴포넌트 통합**
  - 신규 사용자 자동 감지
  - 회원가입 플로우로 자동 이동
  - 기존 사용자 바로 로그인

- ✅ **Dashboard 프로필 버튼 추가**
  - 강사 전용 설정 버튼
  - 프로필 편집 페이지 연결

#### Phase 2: 웹 버전 안정화
- ✅ **반응형 레이아웃 개선** (components/Layout.tsx)
  - 모바일/태블릿/데스크톱 breakpoint 적용
  - 유동적인 padding 및 margin
  - 최대 너비 반응형 조정
  - 보라색 테마 적용 (purple gradient)

- ✅ **에러 바운더리 추가** (components/ErrorBoundary.tsx)
  - React 에러 포착 및 사용자 친화적 UI
  - 페이지 새로고침 기능
  - 에러 메시지 표시
  - App.tsx에 통합

- ✅ **API 에러 핸들링 강화** (services/api.ts)
  - HTTP 상태 코드별 에러 메시지
  - 네트워크 오류 감지
  - JSON 파싱 오류 처리
  - 빈 데이터 응답 검증

#### Phase 3: Calendly 스타일 기능
- ✅ **공개 예약 페이지 UI** (components/PublicBooking.tsx)
  - 강사 정보 카드
  - 예약 안내 섹션
  - CTA 버튼
  - 로딩 및 에러 상태 처리

#### Phase 4: StudioMate 스타일 종합 스튜디오 관리 기능
- ✅ **스튜디오 초기 설정** (components/StudioSetup.tsx)
  - 스튜디오 이름, URL, 전화번호, 소개 설정
  - 강사 최초 로그인 시 온보딩 플로우
  - 프로필 완성 후 대시보드로 이동

- ✅ **수강권 관리** (components/PackageManagement.tsx)
  - 개인 레슨/그룹 수업 수강권 생성
  - 횟수, 유효기간, 가격 설정
  - 수강권 활성화/비활성화 관리
  - CRUD 전체 기능

- ✅ **그룹 클래스 스케줄링** (components/GroupClassSchedule.tsx)
  - 그룹 수업 일정 생성 및 관리
  - 정원 설정 (최대 인원/현재 인원)
  - 수업 상태 관리 (scheduled/cancelled/completed)
  - 날짜/시간 선택 UI

- ✅ **출석 체크 시스템** (components/AttendanceCheck.tsx)
  - 오늘/대기중/전체 필터링
  - 원클릭 출석 체크 (출석/지각/결석)
  - 실시간 통계 표시
  - 수강생별 출석 상태 관리

- ✅ **통계 대시보드** (components/StatsDashboard.tsx)
  - 매출 통계 (월간/총계)
  - 회원 수 통계 (활성/전체)
  - 출석률 분석
  - 인기 시간대 분석
  - 최근 거래 내역

- ✅ **확장된 Dashboard** (components/Dashboard.tsx)
  - 7개 탭 시스템 (Stats, Reservations, Group Classes, Attendance, Members, Packages, Settings)
  - 기본 탭을 Stats로 변경
  - 모바일 가로 스크롤 지원
  - 아이콘 기반 네비게이션

#### Phase 5: 브랜딩 및 마케팅 페이지
- ✅ **로그인 페이지 리디자인** (components/Login.tsx)
  - Calendly 스타일 미니멀 디자인
  - "예약매니아" 브랜드명 적용
  - 대형 타이포그래피 (5xl-6xl)
  - 보라색 테마 적용
  - 텍스트 중심 레이아웃

- ✅ **가격 정책 페이지** (components/PricingPage.tsx)
  - 4단계 플랜 (무료, Standard, Teams, Enterprise)
  - 전체 50% 할인 적용
  - 월간/연간 결제 토글
  - 상세 기능 비교 테이블
  - 모달 형식으로 표시

- ✅ **랜딩 페이지** (components/LandingPage.tsx)
  - 전체 마케팅 사이트 구조
  - Hero 섹션 (CTAs)
  - Features 섹션 (3개 주요 기능 카드)
  - Benefits 섹션 (6가지 혜택)
  - CTA 섹션 (그라데이션 배경)
  - Footer
  - 반응형 네비게이션 (모바일 메뉴)
  - 가격 정책 모달 통합

- ✅ **App.tsx 라우팅 업데이트**
  - LANDING을 최초 화면으로 설정
  - 사용자 플로우: LANDING → LOGIN → STUDIO_SETUP → DASHBOARD
  - ViewState.LANDING 추가
  - Layout 래퍼 조건부 적용 (LANDING은 full-screen, 나머지는 Layout 래핑)

---

## 🚧 백엔드 통합 필요 작업

다음 작업은 Google Apps Script (Code.gs) 업데이트가 필요합니다:

### 1. 회원가입 API
```javascript
action: 'completeSignup'
필요 파라미터:
- email, name, picture
- userType (student/instructor)
- username (optional, for instructors)
- bio (optional, for instructors)
```

### 2. 로그인 API 수정
```javascript
action: 'login'
반환값에 추가:
- isNewUser: boolean
- userType: string
- username: string (optional)
- bio: string (optional)
```

### 3. 강사 프로필 업데이트 API
```javascript
action: 'updateInstructorProfile'
필요 파라미터:
- email
- name, username, bio
```

### 4. 공개 강사 정보 조회 API
```javascript
action: 'getInstructorPublicInfo'
필요 파라미터:
- instructorEmail
반환값:
- id, name, bio, avatarUrl
```

---

## 📋 다음 단계

### 즉시 작업 가능 (프론트엔드)
- [ ] 코드 스플리팅 최적화
- [ ] 로딩 애니메이션 개선
- [ ] 다크 모드 지원 (선택)

### 백엔드 연동 후 작업
- [ ] 회원가입/로그인 플로우 테스트
- [ ] 프로필 편집 기능 테스트
- [ ] 공개 예약 페이지 라우팅 설정
- [ ] 이메일 알림 시스템 (백엔드)
- [ ] Google Calendar 양방향 동기화

---

## 📝 주요 변경 파일 목록

### 새로 생성된 파일
1. `components/Signup.tsx` - 회원가입 페이지
2. `components/InstructorProfile.tsx` - 강사 프로필 설정
3. `components/ErrorBoundary.tsx` - 에러 바운더리
4. `components/PublicBooking.tsx` - 공개 예약 페이지
5. `components/StudioSetup.tsx` - 스튜디오 초기 설정
6. `components/PackageManagement.tsx` - 수강권 관리
7. `components/GroupClassSchedule.tsx` - 그룹 클래스 스케줄
8. `components/AttendanceCheck.tsx` - 출석 체크
9. `components/StatsDashboard.tsx` - 통계 대시보드
10. `components/LandingPage.tsx` - 마케팅 랜딩 페이지
11. `components/PricingPage.tsx` - 가격 정책 페이지

### 수정된 파일
1. `types.ts` - UserType/ClassType enum, 다수 interface 확장, ViewState 추가
2. `App.tsx` - 프로필 뷰 통합, LANDING 최초 화면 설정, 에러 바운더리 적용
3. `components/Login.tsx` - 회원가입 플로우 통합, 브랜딩 리디자인
4. `components/Dashboard.tsx` - 7개 탭 시스템, 프로필 버튼 추가
5. `components/Layout.tsx` - 반응형 개선, 보라색 테마 적용
6. `services/api.ts` - 에러 핸들링 강화

---

## 🎉 성과 요약

**프론트엔드 작업 100% 완료!**
- 총 6개 파일 수정
- 11개 새 컴포넌트 생성
- Calendly + StudioMate 스타일 종합 스튜디오 관리 시스템 구현
- 웹 반응형 및 에러 핸들링 안정화
- 공개 예약 페이지 UI 완성
- 마케팅 랜딩 페이지 및 가격 정책 페이지 완성
- "예약매니아" 브랜드 아이덴티티 적용 (보라색 테마)

**백엔드 통합을 위한 API 명세 문서화 완료**

---

## 📋 기획: 강사 고객 동선 (Product Roadmap)

### 프로젝트 철학 재확인

**신념**: 고요함을 만들어서 사람들의 창조력을 길러준다
**사명**: AI와 공존하기 위한 '창조력'을 만들 수 있는 모든 환경을 제공한다

### 핵심 설계 철학

1. **고요함 (Calmness)**: 복잡한 설정 없이 자동 연동 - 강사는 클릭 3번으로 새 코칭 시작
2. **창조력 (Empowerment)**: 강사가 자유롭게 여러 코칭(필라테스, 요가, PT 등) 운영 가능
3. **AI 공존 (AI Coexistence)**: 구글 캘린더와 자동 동기화로 강사의 기존 워크플로우 유지

---

### 고객 여정 (Customer Journey)

#### Phase 1: 강사 온보딩 (0 → 첫 코칭 생성)

```
[Step 1] 로그인 (Google OAuth)
┌────────────────────────────────────────┐
│ "Google로 시작하기" 버튼 클릭          │
│ ↓                                       │
│ Google OAuth 팝업                      │
│ - 이메일 인증                           │
│ - 기본 프로필 정보 읽기                 │
│ - 캘린더 읽기/쓰기 권한 자동 요청      │
│   (scope: calendar, calendar.events)   │
└────────────────────────────────────────┘
    ↓
감정: "간단하네? 클릭만 하면 되는구나"
기대: "복잡한 설정 없이 바로 시작할 수 있겠다"

[Step 2] 자동 캘린더 연동 확인
┌────────────────────────────────────────┐
│ 시스템 자동 처리 (사용자 대기 2초)     │
│ ✓ Google Calendar API 연결 성공        │
│ ✓ 기본 캘린더 읽기 권한 확보           │
│ ✓ Directory 시트에 강사 등록           │
│   (InstructorID, Name, CalendarID)     │
└────────────────────────────────────────┘
    ↓
UI 피드백: "캘린더 연동 완료" 토스트 메시지 (보라색)
감정: "자동으로 다 해주네, 편하다"

[Step 3] 스튜디오 기본 정보 입력
┌────────────────────────────────────────┐
│ StudioSetup 화면 (미니멀 폼)           │
│ - 스튜디오 이름: "진슬 필라테스"       │
│ - 전화번호: "010-1234-5678" (선택)     │
│ - 소개: "..."                          │
└────────────────────────────────────────┘
    ↓
감정: "필수 항목만 있어서 부담 없다"
기대: "빨리 끝내고 실제 기능 써보고 싶다"

[Step 4] 대시보드 진입 (첫 화면)
┌────────────────────────────────────────┐
│ Dashboard - Stats 탭 (기본)            │
│                                        │
│ 상단 CTA:                              │
│ ┌──────────────────────────────────┐  │
│ │  "+ 새 코칭 시작" [보라색 버튼]   │  │
│ └──────────────────────────────────┘  │
│                                        │
│ (아직 코칭이 없음)                     │
│ "첫 코칭을 만들어 예약을 받아보세요!"  │
└────────────────────────────────────────┘
    ↓
감정: "깔끔하다. 다음에 뭘 해야 할지 명확하네"
```

#### Phase 2: 코칭 생성 (강사의 핵심 가치 제공)

```
[Step 5] "새 코칭 시작" 클릭
┌────────────────────────────────────────┐
│ 모달 팝업:                             │
│ ┌────────────────────────────────────┐ │
│ │ 코칭 이름 입력                      │ │
│ │ ┌────────────────────────────────┐ │ │
│ │ │ "필라테스 개인 레슨"            │ │ │
│ │ └────────────────────────────────┘ │ │
│ │                                    │ │
│ │ [취소]  [생성하기 →]               │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
    ↓
감정: "간단하네, 이름만 입력하면 되는구나"

[Step 6] 백엔드 자동 처리 (사용자 대기 3초)
┌────────────────────────────────────────┐
│ 시스템 자동 실행:                      │
│ 1. Google Calendar API 호출            │
│    - 새 캘린더 생성 (이름: "필라테스")  │
│    - calendarId 발급 받기              │
│                                        │
│ 2. Coaching 시트에 저장                │
│    - CoachingID (UUID)                 │
│    - CoachingName: "필라테스 개인 레슨"│
│    - GoogleCalendarID: "xyz123..."     │
│    - InstructorID: "coach@gmail.com"   │
│    - CreatedAt: 2025-12-20             │
│                                        │
│ 3. 예약 링크 자동 생성                 │
│    - URL: /book/coach@gmail.com/xyz123 │
└────────────────────────────────────────┘
    ↓
로딩 UI: "코칭 생성 중..." (보라색 스피너)
감정: "시스템이 알아서 다 해주는구나"

[Step 7] 생성 완료 화면
┌────────────────────────────────────────┐
│ 성공 모달:                             │
│ ✓ "필라테스 개인 레슨" 코칭 생성 완료   │
│                                        │
│ 📅 전용 구글 캘린더가 생성되었습니다    │
│    → 구글 캘린더에서 확인하기 [링크]   │
│                                        │
│ 🔗 예약 링크:                          │
│ ┌────────────────────────────────────┐ │
│ │ /book/coach/pilates                │ │
│ │ [복사하기] [공유하기]               │ │
│ └────────────────────────────────────┘ │
│                                        │
│ 다음 단계:                             │
│ • 근무 시간 설정하기 [→]               │
│ • 예약 받기 시작                       │
└────────────────────────────────────────┘
    ↓
감정: "와, 진짜 간단하네! 벌써 예약 링크까지 생겼어"
기대: "이 링크만 공유하면 학생들이 예약할 수 있겠구나"
```

#### Phase 3: 예약 수신 및 자동 동기화

```
[Step 8] 수강생이 예약 링크 접속
┌────────────────────────────────────────┐
│ PublicBooking 페이지                   │
│ /book/coach@gmail.com/pilates          │
│                                        │
│ 강사: 진슬 코치                         │
│ 코칭: 필라테스 개인 레슨                │
│                                        │
│ [날짜 선택] → [시간 선택] → [예약하기]  │
└────────────────────────────────────────┘
    ↓
수강생 감정: "UI가 깔끔하고 예약이 쉽네"

[Step 9] 예약 확정 시 자동 처리
┌────────────────────────────────────────┐
│ 백엔드 자동 실행:                      │
│                                        │
│ 1. 해당 코칭 전용 캘린더에 이벤트 추가 │
│    - Summary: "수강생 이름 - 필라테스" │
│    - Start: 2025-12-25T10:00:00        │
│    - End: 2025-12-25T11:00:00          │
│    - Attendees: [student@gmail.com]    │
│    - Meet Link 자동 생성               │
│                                        │
│ 2. Reservations 시트에 저장            │
│    - ReservationID                     │
│    - CoachingID (어느 코칭인지)        │
│    - StudentEmail                      │
│    - Date, Time                        │
│    - Status: "confirmed"               │
│    - CalendarEventID (동기화용)        │
│                                        │
│ 3. 이메일 알림 발송                    │
│    - To 강사: "새 예약이 있습니다"      │
│    - To 수강생: "예약이 확정되었습니다" │
└────────────────────────────────────────┘
    ↓
강사 경험:
- 구글 캘린더 앱 열면 자동으로 "필라테스" 캘린더에 일정 표시
- 이메일로 알림 수신
- 대시보드에서도 예약 목록 확인 가능

감정: "아무것도 안 했는데 자동으로 다 정리되네, 편하다"
```

#### Phase 4: 다중 코칭 운영 (확장성)

```
[Step 10] 두 번째 코칭 추가
┌────────────────────────────────────────┐
│ Dashboard - Coaching 탭                │
│                                        │
│ 내 코칭 목록:                          │
│ ┌────────────────────────────────────┐ │
│ │ 📅 필라테스 개인 레슨               │ │
│ │    예약 12건 | 이번달 매출 480,000원│ │
│ │    [설정] [예약 링크]               │ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ + 새 코칭 시작                      │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
    ↓
강사: "요가 클래스도 추가해볼까?"

동일 프로세스 반복:
1. "요가 그룹 수업" 입력
2. 시스템이 자동으로 새 구글 캘린더 생성
3. 새 예약 링크 발급: /book/coach/yoga
4. 각 코칭마다 별도 캘린더 = 수업 구분 명확

결과:
┌────────────────────────────────────────┐
│ 구글 캘린더 앱에서 보이는 화면:         │
│                                        │
│ [내 캘린더]                            │
│ ☑ 개인 일정 (기본 캘린더)              │
│ ☑ 필라테스 개인 레슨 (코칭 1)          │
│ ☑ 요가 그룹 수업 (코칭 2)              │
│                                        │
│ → 각 코칭별로 색상 구분 가능           │
│ → 한눈에 어떤 수업인지 파악            │
└────────────────────────────────────────┘

감정: "여러 수업을 운영해도 헷갈리지 않고 명확하다"
기대: "더 많은 코칭을 추가해도 문제없겠네"
```

---

### Google Calendar API 연동 설계

#### OAuth 2.0 스코프 (권한 요청)

```javascript
// constants.ts에 추가
export const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/calendar',           // 캘린더 읽기/쓰기
  'https://www.googleapis.com/auth/calendar.events',    // 이벤트 생성/수정/삭제
];
```

#### 로그인 시 자동 연동 플로우

```
[Frontend] Login.tsx
    ↓ Google OAuth 요청 (with calendar scopes)
[Google] OAuth Consent Screen
    ↓ 사용자 승인
[Frontend] OAuth Token 수신
    ↓ Backend에 전달
[Backend] Code.gs - handleLogin()
    ↓
    1. Directory 시트에 강사 등록
    2. CalendarID 필드에 강사 이메일 저장 (기본 캘린더 연동)
    3. 캘린더 접근 테스트 (CalendarApp.getCalendarById)
    4. 연동 상태 반환
```

#### 새 코칭 생성 시 캘린더 자동 생성

```javascript
// Code.gs - 새 함수 추가
function handleCreateCoaching(params) {
  const { instructorId, coachingName } = params;

  // 1. 새 구글 캘린더 생성
  const newCalendar = CalendarApp.createCalendar(coachingName, {
    summary: `${coachingName} - 예약 전용`,
    timeZone: 'Asia/Seoul',
    color: CalendarApp.Color.PURPLE  // 보라색 테마
  });

  const calendarId = newCalendar.getId();

  // 2. Coaching 시트에 저장
  const db = getInstructorSpreadsheet(instructorId);
  const coachingSheet = db.getSheetByName('Coachings') || db.insertSheet('Coachings');

  const coachingId = Utilities.getUuid();
  coachingSheet.appendRow([
    coachingId,
    coachingName,
    calendarId,
    instructorId,
    new Date(),
    'active'
  ]);

  // 3. 예약 링크 생성
  const bookingUrl = `/book/${instructorId}/${coachingId}`;

  return {
    coachingId,
    coachingName,
    calendarId,
    bookingUrl
  };
}
```

#### 예약 시 캘린더 이벤트 추가

```javascript
// Code.gs - handleMakeReservation 수정
function handleMakeReservation(db, params, instructorId) {
  const { email, date, time, coachingId } = params;

  // 1. 어느 코칭인지 조회
  const coachingSheet = db.getSheetByName('Coachings');
  const coachingData = coachingSheet.getDataRange().getValues();
  let calendarId = null;

  for (let i = 1; i < coachingData.length; i++) {
    if (coachingData[i][0] === coachingId) {
      calendarId = coachingData[i][2];  // 해당 코칭의 전용 캘린더 ID
      break;
    }
  }

  if (!calendarId) throw new Error('코칭을 찾을 수 없습니다.');

  // 2. 해당 코칭 전용 캘린더에 이벤트 추가
  const startTime = new Date(`${date}T${time}:00`);
  const endTime = new Date(startTime.getTime() + 3600000);  // +1시간

  const eventResource = {
    summary: `${email} - ${coachingName}`,
    start: { dateTime: startTime.toISOString() },
    end: { dateTime: endTime.toISOString() },
    attendees: [{ email: email }],
    conferenceData: {
      createRequest: {
        requestId: Utilities.getUuid(),
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    }
  };

  const event = Calendar.Events.insert(
    eventResource,
    calendarId,  // 코칭 전용 캘린더에 추가!
    { conferenceDataVersion: 1, sendUpdates: 'all' }
  );

  // 3. Reservations 시트에 저장 (coachingId 포함)
  const resSheet = db.getSheetByName(SHEET_RESERVATIONS);
  resSheet.appendRow([
    Utilities.getUuid(),
    coachingId,  // 어느 코칭인지 기록
    email,
    date,
    time,
    'confirmed',
    new Date(),
    event.id,
    event.hangoutLink
  ]);

  return { meetLink: event.hangoutLink, status: 'confirmed' };
}
```

#### 예약 취소/수정 시 동기화

```javascript
// Code.gs - handleCancelReservation 수정
function handleCancelReservation(db, params) {
  const { reservationId } = params;

  const resSheet = db.getSheetByName(SHEET_RESERVATIONS);
  const resData = resSheet.getDataRange().getValues();

  for (let i = 1; i < resData.length; i++) {
    if (resData[i][0] === reservationId) {
      const coachingId = resData[i][1];
      const eventId = resData[i][7];

      // 1. 코칭 전용 캘린더 ID 조회
      const coachingSheet = db.getSheetByName('Coachings');
      const calendarId = findCalendarIdByCoachingId(coachingSheet, coachingId);

      // 2. 구글 캘린더 이벤트 삭제
      Calendar.Events.remove(calendarId, eventId, { sendUpdates: 'all' });

      // 3. Reservations 시트 상태 업데이트
      resSheet.getRange(i + 1, 6).setValue('cancelled');

      break;
    }
  }

  return { status: 'cancelled' };
}
```

---

### 데이터 아키텍처

#### 엔티티 관계도 (ERD)

```
[Master Spreadsheet]
├─ Directory (강사 디렉토리)
│  ├─ InstructorID (PK)
│  ├─ Name
│  ├─ SpreadsheetID (강사별 DB)
│  ├─ DefaultCalendarID (기본 캘린더)
│  └─ CreatedAt

[Instructor Spreadsheet] (강사별 DB)
├─ Coachings (코칭 목록)
│  ├─ CoachingID (PK, UUID)
│  ├─ CoachingName (예: "필라테스 개인 레슨")
│  ├─ GoogleCalendarID (전용 캘린더 ID) ★
│  ├─ InstructorID (FK → Directory)
│  ├─ Status (active/inactive)
│  ├─ CreatedAt
│  └─ Settings (JSON: 가격, 시간, 정원 등)
│
├─ Reservations (예약 목록)
│  ├─ ReservationID (PK, UUID)
│  ├─ CoachingID (FK → Coachings) ★
│  ├─ StudentEmail
│  ├─ Date
│  ├─ Time
│  ├─ Status (confirmed/cancelled/completed)
│  ├─ CalendarEventID (구글 캘린더 이벤트 ID) ★
│  ├─ MeetLink
│  └─ CreatedAt
│
├─ Users (수강생 목록)
│  ├─ Email (PK)
│  ├─ Name
│  ├─ Phone
│  ├─ Packages (수강권 정보 JSON)
│  └─ CreatedAt
│
└─ Settings (강사 설정)
   ├─ WorkingHours (근무 시간)
   └─ Notifications (알림 설정)
```

#### 데이터 흐름 (Data Flow)

```
1. 강사 로그인
   ↓
   Directory 시트 조회
   → InstructorID 존재? YES → 해당 SpreadsheetID 반환
                           NO  → 새 Spreadsheet 생성 + Directory에 등록

2. 코칭 생성
   ↓
   Google Calendar API → 새 캘린더 생성
   ↓
   Coachings 시트에 저장 (CoachingID, CalendarID 매핑)

3. 예약 생성
   ↓
   Coachings 시트 조회 → CoachingID로 CalendarID 찾기
   ↓
   Google Calendar API → 해당 캘린더에 이벤트 추가
   ↓
   Reservations 시트에 저장 (CoachingID, EventID 기록)

4. 예약 조회
   ↓
   Reservations 시트 조회 (CoachingID로 필터링)
   ↓
   Coachings 시트 JOIN → 코칭 이름 표시

5. 예약 취소
   ↓
   Reservations 시트 조회 → EventID 찾기
   ↓
   Coachings 시트 JOIN → CalendarID 찾기
   ↓
   Google Calendar API → 이벤트 삭제
   ↓
   Reservations 시트 상태 업데이트
```

#### Google Sheets 데이터 구조 예시

**Coachings 시트:**
| CoachingID | CoachingName | GoogleCalendarID | InstructorID | Status | CreatedAt |
|------------|--------------|------------------|--------------|--------|-----------|
| uuid-001 | 필라테스 개인 레슨 | cal_pilates_xyz | coach@gmail.com | active | 2025-12-20 |
| uuid-002 | 요가 그룹 수업 | cal_yoga_abc | coach@gmail.com | active | 2025-12-21 |

**Reservations 시트:**
| ReservationID | CoachingID | StudentEmail | Date | Time | Status | EventID | MeetLink |
|---------------|------------|--------------|------|------|--------|---------|----------|
| res-001 | uuid-001 | student1@gmail.com | 2025-12-25 | 10:00 | confirmed | evt_123 | meet.google.com/xyz |
| res-002 | uuid-002 | student2@gmail.com | 2025-12-26 | 14:00 | confirmed | evt_456 | meet.google.com/abc |

#### 캘린더 ID 매핑 전략

```
강사 1명 → N개 코칭 → N개 구글 캘린더

예시:
┌─────────────────────────────────────────────────────────┐
│ 강사: coach@gmail.com                                   │
│ ├─ 기본 캘린더: coach@gmail.com (개인 일정)             │
│ ├─ 코칭 1: cal_pilates_xyz (필라테스 예약 전용)         │
│ ├─ 코칭 2: cal_yoga_abc (요가 예약 전용)                │
│ └─ 코칭 3: cal_pt_def (PT 예약 전용)                    │
└─────────────────────────────────────────────────────────┘

장점:
✓ 수업별로 색상 구분 가능 (구글 캘린더 UI)
✓ 캘린더 공유 설정 독립적 (필라테스만 공개, 요가는 비공개 등)
✓ 예약 충돌 방지 명확 (같은 캘린더 내에서만 체크)
✓ 통계 분석 용이 (코칭별 예약 건수 집계)
```

---

### 철학 반영 체크리스트

#### 1. 고요함 (Calmness)

- ✅ **복잡한 설정 없이 자동 연동**
  - 강사는 "Google로 시작하기" 버튼만 클릭
  - OAuth 승인 1번으로 캘린더 권한 자동 획득
  - 백엔드가 자동으로 캘린더 생성 및 연동 처리

- ✅ **미니멀한 UI**
  - 코칭 생성: 이름만 입력 (1개 필드)
  - 불필요한 옵션 숨김 (고급 설정은 별도 탭)
  - 보라색 그라데이션 + 여백 중심 디자인

- ✅ **인지 부하 최소화**
  - "다음에 뭘 해야 하나?" → CTA 버튼 1개만 강조
  - 진행 단계 명확 표시 (1/3, 2/3, 3/3)
  - 에러 메시지 친절 (전문 용어 없이 평문으로)

#### 2. 창조력 지원 (Empowerment)

- ✅ **강사가 자유롭게 여러 코칭 운영**
  - 무제한 코칭 생성 가능 (무료 플랜도 3개까지)
  - 각 코칭마다 독립적인 설정 (가격, 시간, 정원)
  - 코칭별 통계 분리 (매출, 예약 건수)

- ✅ **반복 작업 자동화**
  - 예약 확정 시 자동으로:
    - 구글 캘린더 이벤트 추가
    - Meet 링크 생성
    - 이메일 알림 발송
    - 수강권 차감

- ✅ **데이터 기반 인사이트**
  - 인기 시간대 분석 (어느 시간에 예약 많은지)
  - 코칭별 매출 비교 (필라테스 vs 요가)
  - 월간 트렌드 차트

#### 3. AI 공존 환경 (AI Coexistence)

- ✅ **기술이 사람을 대체하지 않고 돕는 도구**
  - 강사의 기존 워크플로우 유지 (구글 캘린더 계속 사용)
  - 자동화와 수동 제어 균형:
    - 자동: 캘린더 동기화, 이메일 발송
    - 수동: 예약 승인/거절, 일정 수정

- ✅ **학습 곡선 최소화**
  - 구글 계정만 있으면 시작 가능
  - 별도 프로그램 설치 불필요 (웹 기반)
  - 강사가 이미 익숙한 구글 캘린더와 연동

- ✅ **사용자가 언제나 통제권 보유**
  - 코칭 활성화/비활성화 토글
  - 예약 수동 승인 모드 선택 가능
  - 캘린더 동기화 ON/OFF 설정

---

### 구현 우선순위

#### Phase 1: 기본 인프라 (1-2주)

**목표**: 강사가 로그인 → 코칭 생성 → 예약 링크 발급까지 완성

- [ ] **백엔드 API 개발** (Code.gs)
  - [ ] `handleCreateCoaching` - 코칭 생성 + 구글 캘린더 생성
  - [ ] `handleGetCoachings` - 강사의 코칭 목록 조회
  - [ ] `handleUpdateCoaching` - 코칭 설정 수정
  - [ ] `handleDeleteCoaching` - 코칭 삭제 + 캘린더 삭제
  - [ ] Coachings 시트 자동 생성 (setupInstructorSheet 수정)

- [ ] **프론트엔드 컴포넌트** (React)
  - [ ] `CoachingManagement.tsx` - 코칭 목록/생성/수정 UI
  - [ ] Dashboard에 "Coachings" 탭 추가
  - [ ] types.ts에 Coaching 인터페이스 추가
  - [ ] api.ts에 coaching 관련 함수 추가

- [ ] **Google OAuth 스코프 확장**
  - [ ] constants.ts에 캘린더 권한 추가
  - [ ] Login.tsx OAuth 요청 시 스코프 전달

#### Phase 2: 예약 시스템 통합 (2-3주)

**목표**: 수강생이 예약 → 해당 코칭 캘린더에 자동 등록

- [ ] **예약 플로우 수정**
  - [ ] PublicBooking.tsx - coachingId 파라미터 추가
  - [ ] URL 구조 변경: `/book/{instructorId}` → `/book/{instructorId}/{coachingId}`
  - [ ] 예약 시 어느 코칭인지 선택 UI (강사가 여러 코칭 운영 시)

- [ ] **백엔드 예약 로직 수정**
  - [ ] handleMakeReservation - coachingId 기반으로 캘린더 찾기
  - [ ] handleGetAvailability - 코칭별 근무 시간 설정 지원
  - [ ] Reservations 시트에 CoachingID 컬럼 추가

- [ ] **캘린더 동기화 고도화**
  - [ ] 예약 수정 시 캘린더 이벤트 업데이트
  - [ ] 강사가 구글 캘린더에서 일정 수정 시 양방향 동기화 (webhook)
  - [ ] 충돌 감지 로직 (같은 코칭 캘린더 내에서만 체크)

#### Phase 3: 다중 코칭 UX 개선 (1주)

**목표**: 강사가 여러 코칭을 쉽게 관리할 수 있는 UI/UX

- [ ] **Dashboard 개선**
  - [ ] 코칭별 통계 카드 (매출, 예약 건수, 평균 평점)
  - [ ] 코칭 전환 드롭다운 (현재 보고 있는 코칭 선택)
  - [ ] 전체/코칭별 필터 토글

- [ ] **예약 목록 필터링**
  - [ ] Reservation.tsx - 코칭별 필터 추가
  - [ ] 색상 코딩 (코칭마다 다른 색상 뱃지)
  - [ ] 검색 기능 (수강생 이름, 코칭 이름)

- [ ] **예약 링크 관리**
  - [ ] 코칭별 QR 코드 생성
  - [ ] SNS 공유 버튼 (카카오톡, 인스타그램)
  - [ ] 짧은 URL 생성 (bit.ly 연동)

#### Phase 4: 고급 기능 (2-3주)

**목표**: 강사의 창조력을 극대화하는 고급 기능

- [ ] **코칭별 독립 설정**
  - [ ] 가격 정책 (코칭마다 다른 수강권)
  - [ ] 근무 시간 (필라테스는 오전만, 요가는 저녁만)
  - [ ] 예약 정책 (사전 예약 기간, 취소 기한)

- [ ] **자동화 룰**
  - [ ] 예약 자동 승인/거절 조건 설정
  - [ ] 리마인더 이메일 자동 발송 (예약 1일 전)
  - [ ] 노쇼 자동 감지 및 수강권 복구

- [ ] **통계 및 분석**
  - [ ] 코칭별 매출 비교 차트
  - [ ] 인기 시간대 히트맵
  - [ ] 수강생 재방문율 분석
  - [ ] 월간 리포트 이메일 발송

#### Phase 5: 구글 캘린더 양방향 동기화 (1-2주)

**목표**: 강사가 구글 캘린더에서 수정해도 시스템 자동 반영

- [ ] **Webhook 설정**
  - [ ] Google Calendar API - Push Notification 설정
  - [ ] Code.gs에 doPost 엔드포인트 추가
  - [ ] 캘린더 이벤트 변경 감지

- [ ] **동기화 로직**
  - [ ] 강사가 캘린더에서 일정 삭제 → Reservations 시트 상태 업데이트
  - [ ] 강사가 시간 변경 → 수강생에게 알림
  - [ ] 충돌 해결 (시스템 우선 vs 캘린더 우선 설정)

---

### 기술 명세 (Technical Specifications)

#### Google Calendar API 사용 함수

```javascript
// 1. 새 캘린더 생성
CalendarApp.createCalendar(name, options)

// 2. 캘린더 조회
CalendarApp.getCalendarById(calendarId)

// 3. 이벤트 추가
Calendar.Events.insert(eventResource, calendarId, options)

// 4. 이벤트 수정
Calendar.Events.patch(eventId, eventResource, calendarId)

// 5. 이벤트 삭제
Calendar.Events.remove(calendarId, eventId, options)

// 6. 이벤트 목록 조회
Calendar.Events.list(calendarId, {
  timeMin: startDate.toISOString(),
  timeMax: endDate.toISOString(),
  singleEvents: true
})
```

#### 에러 핸들링 전략

```javascript
// Code.gs
try {
  const newCalendar = CalendarApp.createCalendar(coachingName);
} catch (e) {
  if (e.toString().includes('quota')) {
    throw new Error('일일 캘린더 생성 한도를 초과했습니다. (최대 20개)');
  } else if (e.toString().includes('permission')) {
    throw new Error('캘린더 권한이 부족합니다. 다시 로그인해주세요.');
  } else {
    throw new Error('캘린더 생성 실패: ' + e.toString());
  }
}
```

#### 성능 최적화

```javascript
// 캐싱 전략
const cache = CacheService.getScriptCache();
const cacheKey = `COACHING_LIST_${instructorId}`;
const cachedData = cache.get(cacheKey);

if (cachedData) {
  return JSON.parse(cachedData);
} else {
  const data = fetchCoachingsFromSheet(instructorId);
  cache.put(cacheKey, JSON.stringify(data), 600);  // 10분 캐시
  return data;
}
```

---

### 예상 일정 (Timeline)

```
Week 1-2:  Phase 1 (기본 인프라)
Week 3-5:  Phase 2 (예약 시스템 통합)
Week 6:    Phase 3 (다중 코칭 UX)
Week 7-9:  Phase 4 (고급 기능)
Week 10-11: Phase 5 (양방향 동기화)
Week 12:   QA 및 버그 수정
```

**총 소요 기간: 약 3개월**

---

### 성공 지표 (Success Metrics)

#### 사용자 경험 지표
- 강사 온보딩 완료율: 90% 이상
- 첫 코칭 생성까지 소요 시간: 평균 3분 이내
- 강사당 평균 코칭 수: 2.5개 이상
- 예약 자동 동기화 성공률: 99.9% 이상

#### 기술 지표
- 캘린더 API 호출 성공률: 99% 이상
- 페이지 로딩 속도: 2초 이내
- 에러 발생률: 1% 미만
- 동시 접속자 처리: 100명 이상

#### 비즈니스 지표
- 월 활성 강사 수 (MAU): 100명 이상 (3개월 후)
- 월간 예약 건수: 500건 이상
- 강사 만족도 (NPS): 50+ 이상
- 유료 전환율: 20% 이상

---

**마지막 업데이트**: 2025-12-20 (Phase 6 기획 완료 - 강사 중심 고객 동선)
