# Google OAuth Production 전환 가이드

> **목표**: 예약매니아 앱을 Google OAuth Test 모드에서 Production 모드로 전환하여 모든 사용자가 사용할 수 있도록 함

---

## 📋 사전 준비 사항

### 1. 필수 페이지 확인
- ✅ **개인정보처리방침**: `components/PrivacyPolicy.tsx` (이미 존재)
- ✅ **서비스약관**: `components/TermsOfService.tsx` (이미 존재)
- ✅ Google Calendar API 사용 목적 명시됨

### 2. 도메인 확인
현재 사용 중인 도메인:
- **프로덕션 도메인**: `https://studiomate.kr` (또는 실제 배포 URL 확인 필요)
- **로컬 개발**: `http://localhost:5173`

---

## 🚀 단계별 전환 가이드

### Step 1: Google Cloud Console 접속

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 선택 (예약매니아 프로젝트)
3. 좌측 메뉴 > **"API 및 서비스"** > **"사용자 인증 정보"**

---

### Step 2: OAuth 동의 화면 설정

1. 좌측 메뉴에서 **"OAuth 동의 화면"** 클릭
2. **"앱 수정"** 버튼 클릭

#### 2-1. 앱 정보 입력

```
앱 이름: 예약매니아
사용자 지원 이메일: [귀하의 이메일]
앱 로고: [선택사항] 로고 이미지 업로드 (120x120px 이상)
```

#### 2-2. 앱 도메인 설정

```
애플리케이션 홈페이지: https://studiomate.kr
애플리케이션 개인정보처리방침: https://studiomate.kr/privacy
애플리케이션 서비스 약관: https://studiomate.kr/terms
```

#### 2-3. 승인된 도메인 추가

```
studiomate.kr
```

> **중요**: 도메인은 `https://` 없이 입력합니다.

#### 2-4. 개발자 연락처 정보

```
이메일 주소: [귀하의 이메일]
```

---

### Step 3: 범위(Scope) 설정

1. **"범위"** 탭으로 이동
2. **"범위 추가 또는 삭제"** 클릭
3. 다음 범위를 추가:

#### 필수 범위 (Non-Sensitive)
```
✅ userinfo.email
✅ userinfo.profile
```

#### 민감한 범위 (Sensitive - Google 검토 필요)
```
⚠️ calendar (캘린더 읽기/쓰기)
⚠️ calendar.events (이벤트 생성/수정/삭제)
```

#### 범위 사용 목적 설명 (한글)
```
[calendar]
강사의 예약 가능 시간을 조회하고, 학생이 예약한 일정을 강사의 Google Calendar에 자동으로 추가하기 위해 사용됩니다.

[calendar.events]
예약 확정 시 강사와 학생의 Google Calendar에 이벤트를 생성하고, 예약 취소 시 해당 이벤트를 삭제하기 위해 사용됩니다.
```

#### 범위 사용 목적 설명 (영문)
```
[calendar]
To check the instructor's available time slots and automatically add booked sessions to the instructor's Google Calendar.

[calendar.events]
To create events in both instructor's and student's Google Calendar when a booking is confirmed, and to delete events when a booking is cancelled.
```

---

### Step 4: 테스트 사용자 관리

- **옵션 1**: 모든 테스트 사용자 제거 (프로덕션 전환 후 누구나 사용 가능)
- **옵션 2**: 테스트 사용자 유지 (검토 완료 전까지 제한된 사용자만 접근)

---

### Step 5: 게시 상태 변경

1. **"OAuth 동의 화면"** 페이지 상단의 **"게시 상태를 프로덕션으로 변경"** 버튼 클릭
2. 경고 메시지 확인 후 **"확인"** 클릭

---

## ⚠️ Google 보안 평가 (Security Assessment)

### 민감한 범위 사용 시 필수

민감한 범위(`calendar`, `calendar.events`)를 사용하기 때문에 **Google의 보안 평가**를 받아야 합니다.

#### 평가 과정
- **소요 시간**: 4~6주
- **준비 사항**:
  1. 개인정보처리방침 페이지 (✅ 완료)
  2. 서비스약관 페이지 (✅ 완료)
  3. YouTube 데모 영상 (선택사항, 권장)
  4. Google Calendar API 사용 목적 명시 (✅ 완료)

#### 제출 방법
1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials/consent) 접속
2. **"OAuth 동의 화면"** > **"앱 게시"** 클릭
3. 자동으로 검토 대기열에 추가됨
4. Google로부터 이메일 응답 대기

---

## 🎯 검토 없이 바로 프로덕션 전환하는 방법 (대안)

### Option 1: 내부 사용 앱으로 설정 (G Suite/Workspace 필요)

- **조건**: Google Workspace 계정 필요
- **장점**: 검토 없이 즉시 프로덕션 사용 가능
- **단점**: Organization 내부 사용자만 접근 가능

### Option 2: Calendar API 없이 운영

- Supabase DB만 사용하여 예약 관리
- Google Calendar 연동 기능 제거
- **단점**: 핵심 기능 상실

---

## 📝 현재 API 사용 현황 (최적화 완료)

### ✅ 유지하는 기능 (필수)
1. **캘린더 생성**: `createCoachingCalendar()`
2. **이벤트 추가**: `addEventToCalendar()` (강사 캘린더)
3. **이벤트 추가**: `addEventToStudentCalendar()` (학생 캘린더)
4. **빈 시간 조회**: `getCalendarBusyTimes()` (특정 캘린더만)
5. **권한 관리**: `upgradeCalendarToWriter()`, `addCalendarWriter()`
6. **캘린더 목록 추가**: `ensureCalendarInList()`

### ❌ 제거한 기능 (불필요)
1. ~~전체 캘린더 목록 조회~~ (`getCalendarList()`) - **Google 검토 시 이슈 될 수 있음**
2. ~~캘린더 목록 자동 추가~~ (`addCalendarToList()`) - **선택적 기능**
3. ~~공개 권한 자동 설정~~ (`makeCalendarPublic()`) - **선택적 기능**

---

## 🔧 추가 설정 필요 사항

### 1. OAuth 2.0 클라이언트 ID 설정

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 접속
2. OAuth 2.0 클라이언트 ID 선택
3. **"승인된 JavaScript 원본"** 확인/추가:
   ```
   https://studiomate.kr
   http://localhost:5173 (개발용)
   ```

4. **"승인된 리디렉션 URI"** 확인/추가:
   ```
   https://studiomate.kr/auth/callback
   http://localhost:5173/auth/callback (개발용)
   ```

### 2. Supabase 설정 확인

Supabase Dashboard > Authentication > Providers > Google:
- ✅ Client ID 설정됨
- ✅ Client Secret 설정됨
- ✅ Redirect URL 설정됨

---

## 📊 체크리스트

### 제출 전 확인사항
- [ ] 개인정보처리방침 페이지 접근 가능 (`/privacy`)
- [ ] 서비스약관 페이지 접근 가능 (`/terms`)
- [ ] 도메인 소유권 확인됨
- [ ] OAuth 클라이언트 ID 승인된 도메인 추가됨
- [ ] Google Calendar API 사용 목적 명확히 작성됨
- [ ] 앱 로고 업로드 (선택사항)
- [ ] 데모 영상 준비 (선택사항, 권장)

### 제출 후
- [ ] Google로부터 이메일 응답 확인
- [ ] 추가 정보 요청 시 빠르게 응답
- [ ] 검토 완료 후 Test 모드 사용자 제한 해제

---

## 🆘 문제 해결 (Troubleshooting)

### 1. "Access blocked: This app's request is invalid" 오류
- **원인**: 승인된 도메인 미설정
- **해결**: OAuth 동의 화면에서 도메인 추가

### 2. "This app isn't verified" 경고
- **원인**: 검토 대기 중
- **해결**:
  - 검토 완료 대기 (4~6주)
  - 또는 **"고급"** > **"안전하지 않은 페이지로 이동"** (개발/테스트용)

### 3. Calendar API 권한 거부
- **원인**: Scope 설정 누락
- **해결**: `constants.ts`에서 `GOOGLE_OAUTH_SCOPES` 확인

---

## 📞 지원

### Google 지원팀 연락
- [Google OAuth 지원](https://support.google.com/cloud/answer/6158849)
- [API 및 서비스 지원](https://support.google.com/googleapi)

### 내부 문서 참조
- `CLAUDE.md` - 프로젝트 개요
- `CURRENT_TASK.md` - 작업 로그
- `components/PrivacyPolicy.tsx` - 개인정보처리방침 페이지
- `components/TermsOfService.tsx` - 서비스약관 페이지

---

## ✅ 최종 확인

Google 검토 승인 후:
1. Test 모드 해제
2. 모든 사용자 접근 가능
3. "Unverified app" 경고 제거됨
4. Google Calendar API 정상 작동

**예상 완료 시점**: 제출 후 4~6주

---

*마지막 업데이트: 2024-12-30*
