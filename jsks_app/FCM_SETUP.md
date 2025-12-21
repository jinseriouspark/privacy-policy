# 🔔 Firebase Cloud Messaging (FCM) 설정 가이드

## 📋 목차
1. [Firebase Console 설정](#1-firebase-console-설정)
2. [Supabase 테이블 생성](#2-supabase-테이블-생성)
3. [환경변수 설정](#3-환경변수-설정)
4. [테스트 방법](#4-테스트-방법)
5. [알림 발송 방법](#5-알림-발송-방법)

---

## 1. Firebase Console 설정

### 1-1. Cloud Messaging 활성화
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. `jungsukyulsa` 프로젝트 선택
3. 왼쪽 메뉴에서 **Build > Messaging** 클릭
4. "Get started" 버튼 클릭 (처음이라면)

### 1-2. VAPID 키 생성
1. Project Settings (⚙️ 아이콘) 클릭
2. **Cloud Messaging** 탭 선택
3. **Web Push certificates** 섹션에서:
   - "Generate key pair" 버튼 클릭
   - 생성된 키를 복사 (나중에 `.env` 파일에 사용)

### 1-3. 서비스 계정 키 다운로드 (서버에서 알림 발송용)
1. Project Settings > **Service accounts** 탭
2. **Generate new private key** 버튼 클릭
3. JSON 파일 다운로드
4. 안전한 곳에 보관 (서버 배포 시 사용)

---

## 2. Supabase 테이블 생성

### 2-1. FCM 토큰 저장 테이블
Supabase SQL Editor에서 다음 쿼리 실행:

```sql
-- FCM 토큰 저장 테이블
CREATE TABLE fcm_tokens (
  user_email TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_fcm_tokens_email ON fcm_tokens(user_email);

-- 업데이트 시간 자동 갱신
CREATE OR REPLACE FUNCTION update_fcm_token_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fcm_tokens_update_timestamp
BEFORE UPDATE ON fcm_tokens
FOR EACH ROW
EXECUTE FUNCTION update_fcm_token_timestamp();
```

### 2-2. 알림 로그 테이블 (선택사항)
발송한 알림 기록을 저장하려면:

```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_to TEXT[], -- 발송 대상 이메일 배열
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_by TEXT, -- 발송한 관리자 이메일
  success_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0
);

CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at DESC);
```

---

## 3. 환경변수 설정

`.env` 파일에 다음 내용 추가:

```env
# Firebase Cloud Messaging
VITE_FIREBASE_VAPID_KEY=<Firebase Console에서 생성한 VAPID 키>
```

기존 Firebase 설정은 이미 있으므로 VAPID 키만 추가하면 됩니다.

---

## 4. 테스트 방법

### 4-1. 로컬 테스트
1. 개발 서버 실행: `npm run dev`
2. 브라우저에서 앱 접속
3. 로그인 후 **계정 > 알림 설정** 이동
4. "알림 권한 허용하기" 버튼 클릭
5. 브라우저에서 알림 권한 팝업 → **허용** 클릭
6. 콘솔에서 FCM 토큰 확인:
   ```
   📱 FCM 토큰: eyJhbGciOiJSUzI1NiIsImtpZCI...
   ✅ FCM 토큰 저장 성공
   ```

### 4-2. 테스트 알림 발송
Firebase Console에서 테스트 알림 발송:

1. **Build > Messaging** 메뉴
2. "Send your first message" 또는 "New campaign" 클릭
3. **Firebase Notification message** 선택
4. 제목/내용 입력:
   - 제목: `테스트 알림`
   - 내용: `정수결사 앱 알림 테스트입니다`
5. "Send test message" 클릭
6. 콘솔에서 복사한 FCM 토큰 붙여넣기
7. "Test" 버튼 클릭

**결과**: 브라우저에 알림이 표시됨!

---

## 5. 알림 발송 방법

### 5-1. Firebase Console에서 수동 발송

#### A. 모든 사용자에게 발송
1. **Messaging > New campaign**
2. 제목/내용 입력
3. **Target** 섹션:
   - User segment → "All users" 선택
4. **Schedule** 섹션:
   - "Now" 또는 시간 예약 선택
5. **Review** → **Publish**

#### B. 특정 조건 사용자에게 발송
1. **Target** 섹션에서:
   - "User properties" 선택
   - 조건 설정 (예: `email contains "@gmail.com"`)

### 5-2. 스케줄 알림 설정

#### 매일 아침 6시 수행 알림
1. **Messaging > New campaign**
2. 제목: `오늘의 수행 시간입니다`
3. 내용: `마음을 고요히 하고 오늘도 정진하세요 🙏`
4. **Schedule**:
   - "Custom" 선택
   - "Repeat daily" 체크
   - 시간: `06:00 KST` 설정

#### 새 법문 업로드 시 자동 알림
이건 서버 코드가 필요합니다. 다음 단계에서 구현 가능:

```typescript
// 스님이 법문을 게시할 때 실행
async function sendNewDharmaNotification(dharmaTitle: string) {
  const tokens = await getAllFCMTokens(); // DB에서 모든 토큰 조회

  await sendPushNotification({
    title: '새로운 법문이 올라왔습니다',
    body: dharmaTitle,
    tokens: tokens
  });
}
```

---

## 6. 주요 파일 설명

### `public/firebase-messaging-sw.js`
- Service Worker 파일
- 백그라운드 알림 수신 처리
- 브라우저가 닫혀있어도 알림 받을 수 있음

### `services/messaging.ts`
- FCM 초기화 및 토큰 발급
- 포그라운드 알림 수신
- 권한 요청 로직

### `services/db.ts`
- FCM 토큰 저장/삭제 함수
- `saveFCMToken()`, `deleteFCMToken()`

### `components/views/NotificationSettingsView.tsx`
- 사용자용 알림 설정 UI
- 권한 요청 버튼
- 알림 종류별 ON/OFF

---

## 7. 문제 해결

### 알림이 안 오는 경우

1. **브라우저 설정 확인**
   - Chrome: 설정 > 개인정보 및 보안 > 사이트 설정 > 알림
   - 해당 사이트의 알림이 "허용"으로 되어있는지 확인

2. **HTTPS 확인**
   - 로컬: `localhost`는 HTTP여도 작동
   - 배포: 반드시 HTTPS 필요

3. **Service Worker 등록 확인**
   - 브라우저 개발자 도구 > Application > Service Workers
   - `firebase-messaging-sw.js`가 등록되어 있는지 확인

4. **FCM 토큰 확인**
   - Supabase `fcm_tokens` 테이블에 토큰이 저장되었는지 확인
   - 콘솔에 "✅ FCM 토큰 저장 성공" 로그가 있는지 확인

---

## 8. 다음 단계

현재는 Firebase Console에서 수동으로 알림을 발송해야 합니다.

**자동화하려면:**
1. 서버 함수 작성 (Node.js/Python/Supabase Edge Functions)
2. Firebase Admin SDK 사용
3. 스케줄러 설정 (cron job 또는 Cloud Functions)

예시:
- 매일 아침 6시 → 수행 알림 자동 발송
- 스님이 법문 게시 → 전체 사용자에게 자동 알림
- 절 행사 하루 전 → 참석 신청자에게 리마인더

---

## 📞 지원

문제가 있으면:
1. 브라우저 콘솔 로그 확인
2. Supabase 로그 확인
3. Firebase Console > Messaging > Reports 확인

**성공!** 🎉
