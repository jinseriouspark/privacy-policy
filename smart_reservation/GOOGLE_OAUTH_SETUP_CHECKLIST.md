# Google OAuth 검토 신청 체크리스트

> **최종 업데이트**: 2024-12-30

---

## ✅ 완료된 작업

### 1. 코드 최적화
- ✅ 불필요한 Calendar API 함수 제거 (`getCalendarList()`)
- ✅ 라우팅 경로 수정 (`/privacy`, `/terms`)
- ✅ Vercel 프로덕션 배포 완료
- ✅ Deployment Protection 해제

### 2. 필수 페이지
- ✅ 개인정보처리방침: https://yeyak-mania.co.kr/privacy
- ✅ 서비스약관: https://yeyak-mania.co.kr/terms
- ✅ Google Calendar API 사용 목적 명시

---

## 🎯 Google OAuth 검토 신청 단계

### Step 1: Google Cloud Console 접속
https://console.cloud.google.com/apis/credentials/consent

### Step 2: 앱 정보 확인
- **앱 이름**: 예약매니아
- **사용자 지원 이메일**: [귀하의 이메일]
- **앱 도메인**:
  - 홈페이지: `https://yeyak-mania.co.kr`
  - 개인정보처리방침: `https://yeyak-mania.co.kr/privacy` ✅
  - 서비스 약관: `https://yeyak-mania.co.kr/terms` ✅
- **승인된 도메인**: `yeyak-mania.co.kr`

### Step 3: 범위(Scope) 추가

**"범위 추가 또는 삭제"** 버튼 클릭 후 다음 범위 추가:

#### 필수 범위
```
✅ https://www.googleapis.com/auth/userinfo.email
✅ https://www.googleapis.com/auth/userinfo.profile
```

#### 민감한 범위 (검토 필요)
```
⚠️ https://www.googleapis.com/auth/calendar
⚠️ https://www.googleapis.com/auth/calendar.events
```

### Step 4: 범위 사용 목적 설명

#### calendar (한글)
```
강사가 예약매니아 전용 Google Calendar를 생성하고,
해당 캘린더의 예약 가능 시간을 조회하기 위해 사용됩니다.
```

#### calendar (영문)
```
To create a dedicated Google Calendar for coaching reservations
and check the instructor's available time slots.
```

#### calendar.events (한글)
```
학생이 예약을 확정하면 강사와 학생의 Google Calendar에
예약 일정 이벤트를 자동으로 생성/수정/삭제하기 위해 사용됩니다.
```

#### calendar.events (영문)
```
To automatically create/update/delete reservation events in both
instructor's and student's Google Calendar when a booking is
confirmed or cancelled.
```

### Step 5: OAuth 클라이언트 ID 설정 확인

**"사용자 인증 정보"** > **"OAuth 2.0 클라이언트 ID"** 클릭

#### 승인된 JavaScript 원본
```
https://yeyak-mania.co.kr
http://localhost:5173 (개발용)
```

#### 승인된 리디렉션 URI
```
https://yeyak-mania.co.kr/auth/callback
http://localhost:5173/auth/callback (개발용)
```

### Step 6: 검토 제출

1. **"OAuth 동의 화면"** 페이지 하단
2. **"확인을 위해 제출"** 또는 **"앱 게시"** 버튼 클릭
3. 추가 정보 요청 시 응답 준비:
   - 📹 데모 영상 (선택사항, 권장)
   - 📧 Google로부터 이메일 확인

---

## 📊 검토 기준

Google이 확인하는 항목:
- ✅ 개인정보처리방침 접근 가능
- ✅ 서비스약관 접근 가능
- ✅ 도메인 소유권 확인
- ✅ Calendar API 사용 목적 명확성
- ✅ 사용자 데이터 보안 처리
- ✅ 앱이 실제로 작동하는지 (데모 영상)

---

## ⏱️ 예상 소요 시간

- **일반 검토**: 4~6주
- **추가 정보 요청 시**: +1~2주
- **거부 후 재신청**: +4~6주

---

## 📧 검토 상태 확인

### Google로부터 받을 이메일 종류

1. **제출 확인** (즉시)
   ```
   제목: Your OAuth Consent Screen submission has been received
   ```

2. **추가 정보 요청** (1~2주 후)
   ```
   제목: Additional information needed for your OAuth Consent Screen
   내용: 데모 영상, 추가 설명 요청 등
   ```

3. **승인 완료** (4~6주 후)
   ```
   제목: Your OAuth Consent Screen has been verified
   ```

4. **거부** (드물게 발생)
   ```
   제목: Your OAuth Consent Screen submission has been rejected
   내용: 거부 사유 및 수정 방법
   ```

---

## 🔧 검토 중 앱 사용

검토가 진행되는 동안:
- ⚠️ 사용자 한도: **100명 제한**
- ⚠️ 로그인 시 **"확인되지 않은 앱"** 경고 표시
- ⚠️ 사용자가 **"고급"** > **"안전하지 않은 페이지로 이동"** 클릭 필요

---

## ✅ 승인 후 변화

- ✅ 사용자 한도 **무제한**
- ✅ **"확인되지 않음"** 경고 제거
- ✅ 모든 사용자가 바로 로그인 가능
- ✅ Google Calendar API 정상 작동

---

## 🆘 문제 해결

### 1. "이 앱은 확인되지 않았습니다" 경고가 계속 뜸
- **원인**: 아직 검토 중
- **해결**: 검토 완료 대기 (4~6주)

### 2. 개인정보처리방침 페이지 접근 불가
- **원인**: Vercel Deployment Protection 활성화
- **해결**: Vercel 대시보드에서 Protection 해제 ✅ (완료)

### 3. 검토 거부됨
- **원인**:
  - 개인정보처리방침 불충분
  - Calendar API 사용 목적 불명확
  - 앱이 작동하지 않음
- **해결**:
  - 피드백에 따라 수정
  - 데모 영상 제공
  - 재신청

---

## 📞 지원

### Google 지원팀
- [OAuth 지원](https://support.google.com/cloud/answer/6158849)
- [API 및 서비스 지원](https://support.google.com/googleapi)

### 내부 문서
- `GOOGLE_OAUTH_PRODUCTION_GUIDE.md` - 상세 가이드
- `CLAUDE.md` - 프로젝트 개요
- `CURRENT_TASK.md` - 작업 로그

---

## 🎉 최종 체크리스트

검토 신청 전 확인:
- [ ] 개인정보처리방침 접근 가능 (https://yeyak-mania.co.kr/privacy)
- [ ] 서비스약관 접근 가능 (https://yeyak-mania.co.kr/terms)
- [ ] OAuth 동의 화면 앱 정보 입력 완료
- [ ] Calendar API 범위 추가 완료
- [ ] 사용 목적 설명 작성 완료
- [ ] OAuth 클라이언트 ID 설정 확인
- [ ] 데모 영상 준비 (선택사항, 권장)

모두 확인되면 **"확인을 위해 제출"** 버튼 클릭!

---

*마지막 업데이트: 2024-12-30*
*예상 승인 완료: 2025년 2월 초*
