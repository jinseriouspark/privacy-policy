# Supabase 마이그레이션 가이드

## 📋 목차
1. [Supabase 프로젝트 생성](#1-supabase-프로젝트-생성)
2. [DB 스키마 적용](#2-db-스키마-적용)
3. [환경 변수 설정](#3-환경-변수-설정)
4. [API 코드 변경](#4-api-코드-변경)
5. [테스트](#5-테스트)

---

## 1. Supabase 프로젝트 생성

### 1-1. 회원가입 및 프로젝트 생성
1. https://supabase.com 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인
4. "New Project" 클릭
5. 프로젝트 정보 입력:
   - **Name**: `beopryunsa-app` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 (잘 저장해두세요!)
   - **Region**: `Northeast Asia (Seoul)` 선택
6. "Create new project" 클릭 (약 2분 소요)

### 1-2. API Keys 확인
프로젝트 생성 후:
1. 왼쪽 메뉴 → Settings → API
2. 다음 값들 복사:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (관리자용)

---

## 2. DB 스키마 적용

### 2-1. SQL Editor에서 스키마 실행
1. 왼쪽 메뉴 → SQL Editor
2. "New query" 클릭
3. `supabase_schema.sql` 파일 내용 전체 복사
4. 붙여넣기 후 "Run" 클릭
5. 성공 메시지 확인: "Success. No rows returned"

### 2-2. 테이블 확인
1. 왼쪽 메뉴 → Table Editor
2. 생성된 테이블 확인:
   - ✅ users
   - ✅ practice_items (25개 데이터 자동 입력됨)
   - ✅ practice_logs
   - ✅ schedules
   - ✅ event_rsvp
   - ✅ videos
   - ✅ app_settings

---

## 3. 환경 변수 설정

### 3-1. `.env` 파일 수정

기존:
```env
VITE_GOOGLE_CLIENT_ID=207152218307-5bab17pik3kiosq3jvdo8fiilp373bmn.apps.googleusercontent.com
VITE_SCRIPT_URL=https://script.google.com/macros/s/...
```

변경 후:
```env
# Google OAuth 2.0
VITE_GOOGLE_CLIENT_ID=207152218307-5bab17pik3kiosq3jvdo8fiilp373bmn.apps.googleusercontent.com

# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 4. API 코드 변경

### 4-1. Supabase 클라이언트 설치
```bash
npm install @supabase/supabase-js
```

### 4-2. `services/supabase.ts` 생성
새 파일 생성 예정 (Claude가 작성해드립니다)

### 4-3. `services/db.ts` 교체
기존 Google Sheets API 코드를 Supabase API로 교체

---

## 5. 테스트

### 5-1. 기본 기능 테스트
- [ ] 로그인 (Google OAuth)
- [ ] 온보딩 (수행목표 선택)
- [ ] 수행 기록 저장
- [ ] 일정 추가/조회
- [ ] 법문 영상 조회

### 5-2. 데이터 확인
Supabase Table Editor에서 데이터 생성 확인

---

## 📊 마이그레이션 전후 비교

| 항목 | Google Sheets | Supabase |
|-----|---------------|----------|
| **재배포** | 매번 필요 | 불필요 |
| **CORS** | 수동 설정 | 자동 처리 |
| **성능** | 느림 (2-3초) | 빠름 (0.1초) |
| **디버깅** | 어려움 | 쉬움 (실시간 로그) |
| **확장성** | 제한적 | 무제한 |
| **실시간** | 불가능 | 가능 |

---

## 🚀 예상 소요 시간

| 단계 | 시간 |
|-----|------|
| Supabase 프로젝트 생성 | 5분 |
| DB 스키마 적용 | 5분 |
| 환경 변수 설정 | 2분 |
| API 코드 변경 | 1시간 |
| 테스트 | 30분 |
| **총** | **약 2시간** |

---

## ⚠️ 주의사항

1. **데이터 백업**: Google Sheets 데이터 백업 필수
2. **API Keys 보안**: `.env` 파일은 절대 Git에 커밋하지 마세요
3. **RLS 확인**: Row Level Security가 제대로 작동하는지 테스트
4. **점진적 마이그레이션**:
   - 먼저 개발 환경에서 테스트
   - 문제 없으면 프로덕션 적용

---

## 📞 도움이 필요하면

각 단계에서 문제가 생기면 Claude에게 물어보세요!
- Supabase 설정 문제
- SQL 에러
- API 코드 작성
- 디버깅
