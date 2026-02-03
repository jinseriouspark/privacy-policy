# Smart Reservation - 프로젝트 개요

## 핵심 철학

### 신념 (Belief)
**나는 고요함을 만들어서 사람들의 창조력을 길러준다**

### 사명 (Mission)
**AI와 공존하기 위한 '창조력'을 만들 수 있는 모든 환경을 제공한다**

### 디자인 원칙 (Design Principles)
신념과 사명에서 추출한 핵심 원칙:

1. **고요함 (Calmness)**
   - 불필요한 정보와 기능을 제거하여 집중할 수 있는 환경 조성
   - 미니멀한 UI/UX로 사용자의 인지 부하 최소화
   - 조용한 색상 (보라색 그라데이션), 여백 중심 레이아웃

2. **창조력 지원 (Empowerment)**
   - 사용자가 자신의 방식으로 스튜디오를 운영할 수 있는 유연성 제공
   - 반복 작업 자동화로 창조적 활동에 집중할 시간 확보
   - 데이터 기반 인사이트로 더 나은 의사결정 지원

3. **AI 공존 환경 (AI Coexistence)**
   - 기술이 사람을 대체하는 것이 아닌, 사람을 돕는 도구로 설계
   - 자동화와 수동 제어의 균형 (사용자가 언제나 통제권 보유)
   - 학습 곡선 최소화: 직관적인 인터페이스

4. **접근성 (Accessibility)**
   - 누구나 쉽게 시작할 수 있는 무료 플랜
   - 복잡한 설정 없이 즉시 사용 가능
   - 모바일/PC 모두 동일한 경험 제공

### 모션 디자인 원칙 (Motion Design Principles)

1. **Easing 타입 제한**
   - **Bezier**: 기본 전환, 페이드, 슬라이드 등 표준 애니메이션
   - **Spring**: 인터랙티브 요소, 사용자 액션에 대한 피드백 (클릭, 드래그 등)
   - 이 두 가지만 사용하여 일관성 유지

2. **단일 모션 원칙 (One Motion Per Target)**
   - 하나의 요소(타겟)에는 하나의 모션만 적용
   - 여러 속성을 동시에 애니메이션할 때도 하나의 모션 정의로 통합
   - 중첩된 애니메이션 금지 (복잡성 방지)

3. **타임라인 (Timeline)**
   - 여러 요소에 순차적/동시 모션을 적용할 때 사용
   - 예: 리스트 아이템들의 스태거 애니메이션, 다단계 화면 전환
   - 개별 모션들을 조율하는 역할 (orchestration)

4. **모션 사용 기준**
   - **필수**: 화면 전환, 상태 변화, 사용자 피드백
   - **금지**: 불필요한 장식, 주의 산만하게 하는 효과
   - **원칙**: 고요함을 해치지 않는 선에서 부드러운 경험 제공

---

## 프로젝트 정보
- **프로젝트명**: 예약매니아 (Smart Reservation)
- **타입**: 웹 애플리케이션 (모바일 반응형)
- **주요 기능**: Calendly + StudioMate 스타일 종합 스튜디오 관리 시스템
- **브랜드 컬러**: 보라색 (Purple) 그라데이션 테마 (고요함의 상징)

## 기술 스택
- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend**: Google Apps Script (Serverless)
- **Authentication**: Google OAuth 2.0
- **Deployment**: Google Apps Script Web App

## 프로젝트 구조
```
smart_reservation/
├── components/                    # React 컴포넌트
│   ├── Layout.tsx                # 레이아웃 래퍼 (보라색 테마, 반응형)
│   ├── ErrorBoundary.tsx         # 전역 에러 핸들러
│   │
│   ├── LandingPage.tsx           # 🆕 마케팅 랜딩 페이지 (최초 화면)
│   ├── PricingPage.tsx           # 🆕 가격 정책 페이지 (모달)
│   │
│   ├── Login.tsx                 # 로그인 (Google OAuth, 미니멀 디자인)
│   ├── Signup.tsx                # 회원가입 (계정 유형 선택)
│   │
│   ├── StudioSetup.tsx           # 🆕 스튜디오 초기 설정 (강사 온보딩)
│   ├── InstructorProfile.tsx     # 강사 프로필 관리
│   │
│   ├── Dashboard.tsx             # 🔄 메인 대시보드 (7개 탭)
│   ├── StatsDashboard.tsx        # 🆕 통계 대시보드 (매출, 회원, 출석)
│   ├── Reservation.tsx           # 예약 관리 (1:1 레슨)
│   ├── GroupClassSchedule.tsx    # 🆕 그룹 클래스 스케줄
│   ├── AttendanceCheck.tsx       # 🆕 출석 체크 시스템
│   ├── PackageManagement.tsx     # 🆕 수강권 관리 (CRUD)
│   ├── PublicBooking.tsx         # 공개 예약 페이지
│   │
│   ├── InstructorList.tsx        # 강사 목록 (다중 강사 모드용)
│   └── InstructorSetupModal.tsx  # 강사 설정 모달
│
├── services/                     # API 서비스 레이어
│   └── api.ts                    # Google Apps Script API 통신
│
├── utils/                        # 유틸리티 함수
│   └── auth.ts                   # JWT 디코딩, 인증 헬퍼
│
├── App.tsx                       # 🔄 메인 앱 (라우팅 로직)
├── types.ts                      # 🔄 TypeScript 타입 정의 (확장됨)
├── constants.ts                  # 상수 정의 (Google Client ID 등)
├── main.tsx                      # React 진입점
├── index.css                     # Tailwind CSS import
│
├── Code.gs                       # Google Apps Script 백엔드
├── vite.config.ts                # Vite 설정
├── tailwind.config.js            # Tailwind CSS 설정
├── tsconfig.json                 # TypeScript 설정
│
├── CLAUDE.md                     # 🔄 프로젝트 개요 (이 파일)
└── CURRENT_TASK.md               # 🔄 작업 로그 및 진행 상황
```

**범례**:
- 🆕 = 새로 생성된 파일
- 🔄 = 대폭 수정된 파일

## 핵심 컴포넌트 설명

### 마케팅 & 인증
- **LandingPage.tsx**: 최초 진입 화면, Hero/Features/Benefits/CTA 섹션
- **PricingPage.tsx**: 4단계 플랜 (50% 할인), 월/연 토글, 비교 테이블
- **Login.tsx**: Google OAuth, Calendly 스타일 미니멀 디자인
- **Signup.tsx**: 강사/학생 선택, 프로필 설정

### 강사 온보딩 & 프로필
- **StudioSetup.tsx**: 최초 로그인 시 스튜디오 이름/URL/전화번호 설정
- **InstructorProfile.tsx**: 프로필 편집, 공개 예약 링크 생성

### 메인 대시보드 (7개 탭)
- **Dashboard.tsx**:
  1. Stats (통계) - 기본 탭
  2. Reservations (예약 관리)
  3. Group Classes (그룹 수업)
  4. Attendance (출석 체크)
  5. Members (회원 관리)
  6. Packages (수강권 관리)
  7. Settings (설정)

### StudioMate 스타일 기능
- **StatsDashboard.tsx**: 매출/회원/출석률 통계, 인기 시간대 분석
- **GroupClassSchedule.tsx**: 그룹 수업 일정 관리, 정원 설정
- **AttendanceCheck.tsx**: 출석/지각/결석 체크, 필터링
- **PackageManagement.tsx**: 수강권 생성/편집/삭제, 개인/그룹 구분

## 사용자 플로우

### 신규 사용자
```
LANDING → [무료로 시작] → LOGIN → Google OAuth → Signup
  → 강사 선택 → StudioSetup → DASHBOARD (Stats)
  → 학생 선택 → DASHBOARD (Reservations)
```

### 기존 사용자
```
LANDING → [로그인] → LOGIN → Google OAuth → DASHBOARD
  → 강사: Stats 탭 (매출/통계)
  → 학생: Reservations 탭 (예약 현황)
```

### 프로필 미완성 강사
```
LOGIN → Google OAuth → StudioSetup → DASHBOARD
```

## 타입 시스템 (types.ts)

### Enums
- **UserType**: STUDENT, INSTRUCTOR
- **ClassType**: PRIVATE (1:1), GROUP (그룹)
- **ViewState**: LANDING, LOGIN, STUDIO_SETUP, DASHBOARD, RESERVATION, PROFILE

### Key Interfaces
- **User**: 사용자 정보 (email, name, userType, studioName, packages 등)
- **Instructor**: 강사 정보 (id, name, bio, avatarUrl)
- **ClassPackage**: 수강권 (name, type, credits, validDays, price)
- **ClassSession**: 그룹 수업 세션 (date, time, maxCapacity, status)
- **Reservation**: 예약 (date, time, attendanceStatus 등)

## 현재 상태 (2025-12-19)
✅ **프론트엔드 작업 100% 완료**
- 11개 새 컴포넌트 생성
- 6개 기존 파일 대폭 수정
- Calendly + StudioMate 기능 전체 구현
- 브랜드 아이덴티티 확립 ("예약매니아", 보라색 테마)

⏳ **백엔드 통합 대기 중**
- Google Apps Script API 명세 문서화 완료
- 프론트엔드는 백엔드 연동 준비 완료

## 개발 원칙

### 철학 기반 원칙 (Philosophy-Driven)
모든 개발 결정은 **신념**과 **사명**에 부합해야 합니다:

✅ **Before Adding a Feature**
- "이 기능이 사용자에게 고요함을 제공하는가?"
- "이 기능이 창조력을 지원하는가, 방해하는가?"
- "AI가 사람을 대체하는가, 돕는가?"

✅ **Before Adding Complexity**
- "더 단순한 방법은 없는가?"
- "이 복잡성이 사용자에게 가치를 주는가?"
- "학습 곡선이 증가하는가?"

### 실행 원칙 (Implementation)
1. **문서화 필수**: 모든 작업은 CURRENT_TASK.md에 기록
2. **폴더 관리**: CLAUDE.md에 프로젝트 구조 최신 유지
3. **타입 안정성**: TypeScript strict mode 사용
4. **컴포넌트 분리**: 단일 책임 원칙 준수
5. **반응형 우선**: 모바일 first, Tailwind breakpoints 활용
6. **브랜드 일관성**: 보라색 그라데이션 테마 유지 (고요함의 시각화)
7. **미니멀리즘**: 기본값은 항상 "덜 보여주기", 사용자가 필요할 때 더 보기
8. **자동화 우선**: 반복 작업은 시스템이, 창조적 결정은 사용자가

## 주요 기능 요약

### Calendly 스타일
- Google OAuth 로그인
- 공개 예약 페이지 (username 기반 URL)
- 강사/학생 계정 분리
- 프로필 관리

### StudioMate 스타일
- 스튜디오 초기 설정
- 수강권 관리 (개인/그룹)
- 그룹 클래스 스케줄링
- 출석 체크 시스템
- 매출/통계 대시보드
- 회원 관리

### 추가 기능
- 마케팅 랜딩 페이지
- 4단계 가격 정책
- 에러 바운더리
- 반응형 디자인

## 데모 계정 (Demo Account)

실제 기능을 체험할 수 있는 데모 계정이 준비되어 있습니다:

### 데모 강사 로그인
- **이메일**: demo@yeyakmania.com
- **로그인 방법**: Google OAuth ("Google로 계속하기" 버튼 클릭)
- **Short ID**: demo
- **스튜디오**: 예약매니아 데모 스튜디오

### 데모 데이터 포함 사항
- ✅ **학생 10명** (김민준, 이서연, 박지후, 최서윤, 정도윤, 강하은, 조민서, 윤지호, 장수아, 임서준)
- ✅ **수강권 3종** (10회권, 20회권, 5회권 체험)
- ✅ **예약 25건** (과거 15건, 미래 10건)
- ✅ **상담 기록 15건** (다양한 태그 및 날짜)
- ✅ **출석 데이터** (출석/지각/결석 혼합)
- ✅ **통계 대시보드** 데이터 완비

### 데모 데이터 재생성
데모 데이터를 재생성하려면:
```bash
npx tsx scripts/seed-demo-data.ts
```

## 참고사항
- **백엔드**: Supabase (PostgreSQL)
- **배포**: Vercel (https://yeyak-mania.vercel.app)
- **인증**: Google OAuth 2.0 Client ID 설정 필요
- **스타일**: Tailwind CSS 사용, 커스텀 컴포넌트 스타일 없음

---

## 🚧 다음 작업 (TODO)

### 우선순위 1: Google OAuth 프로덕션 승인
**상태**: ⏳ 대기 중

현재 테스트 모드에서 운영 중. 모든 사용자가 사용하려면 프로덕션 승인 필요.

**필요 작업**:
1. [ ] 데모 영상 촬영 (OAuth 동의 화면 → 권한 승인 → 캘린더 이벤트 생성)
2. [ ] YouTube에 Unlisted로 업로드
3. [ ] Google Cloud Console에서 OAuth 승인 제출
4. [ ] 승인 완료 후 테스트 모드 → 프로덕션 모드 전환

**필요한 OAuth Scopes**:
- `calendar.events` - 이벤트 생성/참석자 초대
- `calendar.readonly` - 빈 시간 확인

**Scope 사용 이유**: CURRENT_TASK.md에 이메일 템플릿 준비됨

### 우선순위 2: 기능 개선 (승인 후)
- [ ] 토큰 자동 갱신 로직 추가 (refresh_token 사용)
- [ ] 에러 메시지 개선 (재인증 버튼 추가)
- [ ] `/debug` 진단 페이지 추가

### 참고: Google OAuth 테스트 모드 운영
승인 대기 중에도 테스트 사용자를 추가하여 정상 운영 가능:
1. Google Cloud Console → OAuth 동의 화면 → 테스트 사용자
2. 사용자 이메일 추가
3. 해당 사용자만 로그인 가능
