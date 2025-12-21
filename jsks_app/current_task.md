# Current Task

## 진행 중인 작업
없음

## 완료된 작업
- 2025-12-22: **스님 관리자용 일정 관리 기능 추가 ✅**
  - ✅ 참석자 명단 확인 기능 (절 행사)
    - "명단 보기" 버튼으로 참석 신청자 이메일 목록 확인
    - 펼침/접기 토글 UI
  - ✅ 참석 정원 변경 기능
    - 인라인 편집으로 정원 수정
    - 현재 참석자보다 적게 설정 불가 검증
    - 0 입력 시 무제한으로 변경
  - ✅ 일정 취소 기능
    - 모든 참석 신청 일괄 취소
    - 참석자 수 표시 및 확인 메시지
  - ✅ 절기/특별한 날 삭제 기능
    - 달력에서 절기 표시를 길게 누르면 숨김 처리
    - localStorage 기반으로 숨김 상태 저장
    - 숨긴 날짜는 달력에 더 이상 표시되지 않음
  - ✅ 업데이트된 파일:
    - `ScheduleDetailModal.tsx` - 참석자 관리 UI 및 기능
    - `services/db.ts` - cancelAllRSVP, updateEventCapacity 함수 추가
    - `utils/specialDates.ts` - hideSpecialDate, showSpecialDate 함수
    - `ScheduleView.tsx` - 절기 길게 누르기 이벤트
    - `App.tsx` - ScheduleView에 currentUser 전달
  - ✅ Git 커밋 및 Vercel 배포 완료

  **사용 방법:**
  1. 스님 계정으로 로그인
  2. 절 행사 클릭 시 관리 기능 표시
  3. 참석자 명단 보기, 정원 변경, 일정 취소 가능
  4. 달력에서 절기 표시를 길게 누르면 숨김

## 완료된 작업
- 2025-12-21: **주간 캘린더 날짜 클릭 시 일정 목록 표시 기능 ✅**
  - ✅ WeekCalendar 컴포넌트에 날짜 클릭 기능 추가
  - ✅ 선택된 날짜의 일정 필터링 및 표시
  - ✅ 선택된 날짜에 링 테두리 표시 (시각적 피드백)
  - ✅ 수행 로그 및 완료 기록은 목록에서 제외
  - ✅ 일정 클릭 시 상세 모달 연결 준비
  - ✅ 업데이트된 파일:
    - `components/WeekCalendar.tsx` - 날짜 클릭 및 일정 목록 기능
    - `types.ts` - DayData에 dateStr 필드 추가
  - ✅ Git 커밋 완료 (배포 준비)

  **다음 작업:**
  - 스님 관리자 모드에서 절 일정 삭제 기능 추가

- 2025-12-21: **모바일 관리자 로그인 개선 및 PWA 아이콘 설정 ✅**
  - ✅ 스님 관리자 로그인 모달 모바일 최적화
    - 네이티브 `prompt()` → 커스텀 모달 변경
    - 숫자 키보드 자동 활성화 (`inputMode="numeric"`)
    - 모바일 친화적인 UI (큰 터치 영역, 하드웨어 가속)
  - ✅ 앱 로고 업데이트
    - `logo_gyung.jpeg` → `logo.jpeg` (613KB)
    - 브라우저 캐시 무효화를 위해 파일명 변경
  - ✅ PWA 아이콘 설정 (안드로이드 홈 화면)
    - 6개 크기 PNG 아이콘 생성 (48x48 ~ 512x512)
    - `manifest.json` 업데이트 with `purpose: "any maskable"`
    - 갤럭시 크롬 바로가기에서 로고 정상 표시
  - ✅ 업데이트된 파일:
    - `components/views/LoginView.tsx` - 모달 구현
    - `index.html` - favicon 업데이트
    - `public/logo.jpeg` - 새 로고
    - `public/icons/` - 6개 크기별 아이콘
    - `public/manifest.json` - PWA 설정
    - `public/firebase-messaging-sw.js` - 알림 아이콘 경로
  - ✅ Vercel 배포 완료

  **테스트 방법:**
  1. 모바일에서 제목("정수결사") 5번 탭
  2. "스님(관리자) 로그인" 버튼 클릭
  3. 숫자 키보드로 108 입력
  4. 홈 화면 추가 시 새 로고 표시 확인

- 2025-12-19: **Firebase Cloud Messaging (FCM) 푸시 알림 구현 진행 중 🔔**
  - ✅ Firebase SDK 설치 (`npm install firebase`)
  - ✅ Service Worker 생성 (`/public/firebase-messaging-sw.js`)
  - ✅ FCM 서비스 생성 (`/services/messaging.ts`)
  - ✅ DB 함수 추가 (`services/db.ts` - saveFCMToken, deleteFCMToken)
  - ✅ 알림 설정 UI 구현 (`NotificationSettingsView.tsx`)
  - ✅ FCM_SETUP.md 가이드 문서 작성
  - ✅ Firebase 환경변수 설정 (.env 및 Vercel)
  - ✅ Supabase fcm_tokens 테이블 생성
  - ✅ React 보안 업데이트 (19.2.1 → 19.2.3, CVE-2025-55182)
  - ✅ Vercel 배포 완료

  **현재 상태:**
  - FCM 토큰 발급까지 코드 작성 완료
  - 브라우저 알림 권한이 "거부됨" 상태로 설정되어 있음
  - 알림 권한을 "허용"으로 변경하면 정상 작동할 것으로 예상

  **다음 단계:**
  1. 브라우저 설정에서 알림 권한 허용 (주소창 왼쪽 자물쇠 아이콘 클릭)
  2. FCM 토큰 발급 확인 (콘솔: `📱 FCM 토큰:` 로그)
  3. Supabase fcm_tokens 테이블에 토큰 저장 확인
  4. Firebase Console에서 테스트 알림 발송
  5. 알림 수신 확인 (포그라운드 및 백그라운드)

  **환경변수 설정 완료:**
  - `.env` 파일:
    - VITE_FIREBASE_API_KEY
    - VITE_FIREBASE_AUTH_DOMAIN
    - VITE_FIREBASE_PROJECT_ID
    - VITE_FIREBASE_STORAGE_BUCKET
    - VITE_FIREBASE_MESSAGING_SENDER_ID
    - VITE_FIREBASE_APP_ID
    - VITE_FIREBASE_MEASUREMENT_ID
    - VITE_FIREBASE_VAPID_KEY
  - Vercel Production 환경변수: 위 8개 모두 추가됨

  **Firebase 프로젝트:**
  - 프로젝트 ID: `jungsukyulsa`
  - Console URL: https://console.firebase.google.com/project/jungsukyulsa
  - VAPID Key: `BFvOnCUZZ7uFAn11l-dmpbG2cIIdNreH9FRJ_bliGIO84buHcSL5qpUgkl_gkBJsuam7nzfVB-eEHtiStHlx_D4`

  **생성된 파일:**
  - `/public/firebase-messaging-sw.js` - Service Worker (백그라운드 알림)
  - `/services/messaging.ts` - FCM 초기화 및 토큰 관리
  - `FCM_SETUP.md` - Firebase Console 설정 가이드

  **수정된 파일:**
  - `/services/db.ts` - FCM 토큰 저장/삭제 함수 추가 (lines 695-727)
  - `/components/views/NotificationSettingsView.tsx` - 권한 요청 UI 추가
  - `.env` - Firebase 설정 추가
  - `package.json` - React 19.2.3 업데이트

## 완료된 작업
- 2025-12-14: **Supabase 마이그레이션 완료 ✅**
  - ✅ DB 스키마 생성 (7개 테이블)
  - ✅ Supabase 클라이언트 설치 및 설정
  - ✅ API 코드 완전 교체 (Google Sheets → Supabase)
  - ✅ 관리자 계정 SQL 작성
    - iddhi1@gmail.com (스님)
    - jseul45@gmail.com (개발자)

  **다음 단계:**
  1. Supabase SQL Editor에서 `supabase_init_admins.sql` 실행
  2. 앱 테스트 (로그인, 온보딩, 수행 기록)

- 2025-12-14: **Supabase DB 스키마 설계 완료 ✅**
  - ✅ `supabase_schema.sql` 생성
  - ✅ 7개 테이블 설계:
    - users (사용자)
    - practice_items (수행 항목 - 25개 데이터 포함)
    - practice_logs (수행 기록)
    - schedules (일정)
    - event_rsvp (이벤트 참석)
    - videos (법문 영상)
    - app_settings (앱 설정)
  - ✅ Foreign Keys, Indexes, Triggers 설정
  - ✅ Row Level Security (RLS) 정책
  - ✅ `SUPABASE_MIGRATION_GUIDE.md` 가이드 작성

  **다음 단계:**
  1. Supabase 프로젝트 생성 (5분)
  2. SQL 스키마 실행 (5분)
  3. API 코드 작성 (서비스 레이어 교체)

- 2025-12-14: **CORS 에러 수정 ✅**
  - ✅ 문제: Apps Script CORS 헤더 누락
  - ✅ 에러: "No 'Access-Control-Allow-Origin' header"
  - ✅ 수정: FINAL_COMPLETE_CODE.gs
    - createJSON 함수에 CORS 헤더 추가
    - doOptions 함수 추가 (preflight 요청 처리)
  - ⚠️ **Apps Script 재배포 필요**

- 2025-12-14: **온보딩 저장 버그 수정 ✅**
  - ✅ 문제: handleOnboardingComplete에서 await 누락
  - ✅ 수정: async/await 추가 + 에러 처리
  - ✅ 로깅 추가: 저장 시작/성공/실패 메시지
  - ✅ 사용자 피드백: 실패 시 alert 표시

- 2025-12-14: **일정 조회 성능 개선 ✅**
  - ✅ 캐시 우선 로딩 구현 (빠른 초기 표시)
  - ✅ services/db.ts:
    - getSchedules에 useCache 옵션 추가
    - 캐시가 있으면 즉시 반환 + 백그라운드에서 서버 업데이트
    - 캐시 없으면 서버에서 가져오기
  - ✅ App.tsx:
    - 앱 시작 시: 캐시 사용 (빠른 표시)
    - 일정 추가/수정/삭제 후: 서버에서 최신 데이터 가져오기 (useCache=false)
  - ✅ 각 폰의 localStorage에 일정 캐싱

  **성능 개선:**
  - 앱 시작 시 즉시 일정 표시 (캐시)
  - 백그라운드에서 자동 업데이트
  - 일정 변경 시 최신 데이터 보장

- 2025-12-14: **수행목표 구조 개선 ✅**
  - ✅ 필수 항목 2개 + 선택 항목 23개 = 총 25개 구조로 변경
  - ✅ services/db.ts fallback 데이터 업데이트
    - 필수: 경전읽기, 염불/참선 (자동 선택, 해제 불가)
    - 선택: 정견·공관, 보리심, 육바라밀, 방편·자비, 두 진리, 무주열반, 자기 성찰 (23개)
  - ✅ FINAL_COMPLETE_CODE.gs 업데이트:
    - setupDatabase()에 25개 항목 추가
    - PracticeItems 헤더: id, category, question, order (아이콘 제거)
  - ✅ OnboardingView.tsx 수정:
    - 필수 항목 자동 선택 및 선택 해제 방지
    - 필수 항목 시각적 구분 (secondary 색상 테두리)
    - 안내 문구 업데이트

  **다음 단계:**
  1. Google Sheets에서 PracticeItems 시트 삭제
  2. Apps Script에서 setupDatabase() 실행
  3. 25개 항목 자동 생성 확인

- 2025-12-14: `헬로 claude.md` 및 `current_task.md` 파일 생성
- 2025-12-14: **일정 첨부파일 기능 - Drive API 연동 버전 ✅**
  - ✅ Google Drive API 서비스 생성 (`/services/googleDrive.ts`)
  - ✅ OAuth scope에 Drive 읽기 권한 추가 (스님만)
  - ✅ DriveFilePicker 컴포넌트 생성 (파일 탐색, 검색, 선택)
  - ✅ AddView에 Drive 파일 선택 기능 통합
  - ✅ 스님 드라이브 폴더 ID 연동: `1671a0FUCAr_V0w8zPNDheclN9fF-Loho`

  **사용 방법:**
  1. 스님 계정으로 로그인 (Drive API 권한 자동 연동)
  2. 일정 등록 시 "드라이브에서 파일 선택" 버튼 클릭
  3. 모달에서 파일 검색 및 선택
  4. 선택된 파일이 자동으로 첨부됨
  5. 또는 수동으로 URL 직접 입력 가능 (폴백 옵션)

  **기술 사항:**
  - Drive API는 스님 계정만 연동 (일반 신도 불필요)
  - 스님 폴더의 파일 목록을 실시간으로 불러옴
  - 파일 검색, 썸네일, 파일 크기 표시 지원
  - 신도들은 첨부된 링크만 확인

- 2025-12-14: **구글 시트 저장 문제 해결 ✅**
  - ✅ GET 방식 → POST 방식 변경 (CORS 문제 해결)
  - ✅ URL 길이 제한 문제 해결
  - ✅ 하드코딩된 Apps Script URL 제거

- 2025-12-14: **수행 기록 간소화 ✅**
  - ✅ 수행 항목을 2개로 축소 (간경 읽기, 염불/참선)
  - ✅ services/db.ts fallback 데이터 업데이트
  - ✅ FINAL_COMPLETE_CODE.gs 초기 데이터 업데이트

  **다음 단계:**
  1. Apps Script 재배포 필요
  2. setupDatabase() 함수 실행으로 PracticeItems 시트 초기화

## 대기 중인 작업
없음
