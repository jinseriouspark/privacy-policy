# Google Analytics 4 설정 가이드

## 1. Google Analytics 계정 생성

### 1.1 Google Analytics 계정 만들기
1. [Google Analytics](https://analytics.google.com/) 접속
2. "측정 시작" 클릭
3. 계정 이름 입력 (예: "예약매니아")
4. "다음" 클릭

### 1.2 속성(Property) 만들기
1. 속성 이름 입력 (예: "예약매니아 웹앱")
2. 보고 시간대: "대한민국"
3. 통화: "대한민국 원 (₩)"
4. "다음" 클릭

### 1.3 비즈니스 정보 입력
1. 업종 카테고리: "온라인 커뮤니티"
2. 비즈니스 규모: 본인 상황에 맞게 선택
3. 사용 목적: "고객과의 소통 개선" 선택
4. "만들기" 클릭

### 1.4 데이터 스트림 설정
1. 플랫폼: **"웹"** 선택
2. 웹사이트 URL: 배포된 URL 입력 (예: `https://your-domain.com`)
3. 스트림 이름: "예약매니아 웹" (자동으로 생성됨)
4. "스트림 만들기" 클릭

### 1.5 측정 ID 복사
✅ **중요**: `G-XXXXXXXXXX` 형식의 측정 ID를 복사하세요!

---

## 2. 프로젝트에 측정 ID 적용

### 2.1 .env 파일 수정
`.env` 파일을 열고 다음 줄을 찾아서 측정 ID를 입력하세요:

```bash
# Google Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX  # 여기에 복사한 측정 ID 입력
```

예시:
```bash
VITE_GA_MEASUREMENT_ID=G-1234567890
```

### 2.2 개발 서버 재시작
```bash
npm run dev
```

재시작 후 콘솔에서 다음 메시지를 확인:
```
[Analytics] Google Analytics initialized
```

---

## 3. 추적되는 데이터

### 3.1 자동 추적 (페이지뷰)
모든 페이지 이동이 자동으로 추적됩니다:
- `/` - 랜딩 페이지
- `/login` - 로그인
- `/onboarding` - 계정 유형 선택
- `/summary` - 대시보드 (통계)
- `/all-reservation` - 전체 예약
- `/group` - 그룹 수업
- `/attend` - 출석 체크
- `/student` - 수강생 관리
- `/membership` - 수강권 관리
- `/setting` - 설정
- `/class` - 코칭 관리
- `/{coach_id}/{class_slug}` - 예약 페이지

### 3.2 자동 추적 (이벤트)
다음 사용자 행동이 자동으로 추적됩니다:

#### 사용자 이벤트
- **로그인** (`User > Login > google`)
- **로그아웃** (`User > Logout`)
- **회원가입** (`User > Signup > instructor/student`)
- **계정 유형 선택** (`User > Select Account Type > instructor/student`)

#### 코칭 이벤트
- **코칭 생성** (`Coaching > Create > {coachingId}`)
- **코칭 삭제** (`Coaching > Delete > {coachingId}`)
- **캘린더 연동** (`Coaching > Connect Calendar > {coachingId}`)

#### 예약 이벤트
- **예약 생성** (`Reservation > Create > private/group`)
- **예약 취소** (`Reservation > Cancel > private/group`)

#### 수강권 이벤트
- **수강권 생성** (`Package > Create > {packageType}`)
- **수강권 삭제** (`Package > Delete > {packageType}`)

#### 초대 이벤트
- **초대장 발송** (`Invitation > Send`)
- **초대 수락** (`Invitation > Accept`)

#### 대시보드 이벤트
- **탭 조회** (`Dashboard > View Tab > {tabName}`)

#### 공유 이벤트
- **링크 복사** (`Share > Copy Link > coaching/invitation`)

---

## 4. 코드에서 커스텀 이벤트 추가하기

### 4.1 기본 사용법
```typescript
import { analytics } from './lib/analytics';

// 예약 생성 시
analytics.createReservation('private');

// 코칭 생성 시
analytics.createCoaching(coachingId);

// 초대장 발송 시
analytics.sendInvitation();
```

### 4.2 커스텀 이벤트 만들기
`lib/analytics.ts` 파일에 새로운 이벤트 추가:

```typescript
export const analytics = {
  // ... 기존 이벤트들

  // 새로운 이벤트 추가
  paymentCompleted: (amount: number) => {
    trackEvent('Payment', 'Completed', undefined, amount);
  },

  reviewSubmitted: (rating: number) => {
    trackEvent('Review', 'Submit', undefined, rating);
  },
};
```

---

## 5. Google Analytics에서 데이터 확인

### 5.1 실시간 데이터 확인
1. Google Analytics 대시보드 접속
2. 왼쪽 메뉴 > **"보고서" > "실시간"** 클릭
3. 현재 활성 사용자, 페이지뷰, 이벤트 실시간 확인

### 5.2 페이지 조회수 확인
1. 왼쪽 메뉴 > **"보고서" > "참여도" > "페이지 및 화면"**
2. 어떤 페이지가 가장 많이 조회되는지 확인

### 5.3 이벤트 확인
1. 왼쪽 메뉴 > **"보고서" > "참여도" > "이벤트"**
2. 각 이벤트별 발생 횟수 확인

### 5.4 사용자 흐름 확인
1. 왼쪽 메뉴 > **"탐색" > "경로 탐색"**
2. 사용자가 어떤 경로로 이동하는지 확인

### 5.5 전환 추적 설정 (선택사항)
1. 왼쪽 메뉴 > **"관리" > "이벤트"**
2. 중요한 이벤트를 "전환"으로 표시
   - 예: `createReservation`, `createPackage`, `signup` 등

---

## 6. 자주 사용하는 GA4 쿼리 (탐색 분석)

### 6.1 커스텀 보고서 만들기
1. 왼쪽 메뉴 > **"탐색" > "자유 형식"**
2. 원하는 측정기준과 측정항목 드래그 앤 드롭

### 6.2 유용한 분석 예시

#### 페이지별 체류 시간
- 측정기준: `페이지 경로`
- 측정항목: `평균 참여 시간`, `조회수`

#### 사용자 유형별 행동
- 측정기준: `이벤트 이름`
- 측정항목: `이벤트 수`
- 필터: 특정 이벤트만 (예: `User - Select Account Type`)

#### 예약 전환율
- 측정기준: `페이지 경로`
- 측정항목: `이벤트 수`
- 필터: `createReservation` 이벤트

#### 강사 vs 학생 가입 비율
- 측정기준: `이벤트 매개변수 - label`
- 측정항목: `이벤트 수`
- 필터: `User - Select Account Type` 이벤트

---

## 7. BigQuery 연동 (고급)

데이터를 SQL로 직접 쿼리하려면:

### 7.1 BigQuery 연동 설정
1. Google Analytics > **"관리" > "BigQuery 연결"**
2. "연결" 클릭
3. Google Cloud 프로젝트 선택 (또는 새로 생성)
4. 데이터 스트림 선택
5. "제출" 클릭

### 7.2 BigQuery에서 쿼리 예시

#### 일별 페이지뷰
```sql
SELECT
  event_date,
  COUNT(*) as pageviews
FROM `your-project.analytics_XXXXXXXXX.events_*`
WHERE event_name = 'page_view'
GROUP BY event_date
ORDER BY event_date DESC
LIMIT 30
```

#### 이벤트별 통계
```sql
SELECT
  event_name,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_pseudo_id) as unique_users
FROM `your-project.analytics_XXXXXXXXX.events_*`
WHERE _TABLE_SUFFIX BETWEEN '20250101' AND '20250131'
GROUP BY event_name
ORDER BY event_count DESC
```

#### 사용자 유형별 전환율
```sql
WITH user_types AS (
  SELECT
    user_pseudo_id,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'label') as user_type
  FROM `your-project.analytics_XXXXXXXXX.events_*`
  WHERE event_name = 'User - Select Account Type'
),
reservations AS (
  SELECT
    user_pseudo_id,
    COUNT(*) as reservation_count
  FROM `your-project.analytics_XXXXXXXXX.events_*`
  WHERE event_name = 'Reservation - Create'
  GROUP BY user_pseudo_id
)
SELECT
  ut.user_type,
  COUNT(DISTINCT ut.user_pseudo_id) as total_users,
  COUNT(DISTINCT r.user_pseudo_id) as users_with_reservations,
  ROUND(COUNT(DISTINCT r.user_pseudo_id) / COUNT(DISTINCT ut.user_pseudo_id) * 100, 2) as conversion_rate
FROM user_types ut
LEFT JOIN reservations r ON ut.user_pseudo_id = r.user_pseudo_id
GROUP BY ut.user_type
```

---

## 8. 개발/프로덕션 환경 분리

### 8.1 별도 측정 ID 사용 권장
- **개발 환경**: `G-DEV1234567` (테스트용)
- **프로덕션 환경**: `G-PROD1234567` (실제 사용자)

### 8.2 .env 파일 분리
```bash
# .env.development
VITE_GA_MEASUREMENT_ID=G-DEV1234567

# .env.production
VITE_GA_MEASUREMENT_ID=G-PROD1234567
```

---

## 9. 문제 해결

### Q1: 콘솔에 "GA Measurement ID not set" 경고가 뜹니다
**A**: `.env` 파일에 `VITE_GA_MEASUREMENT_ID`가 설정되지 않았거나, 개발 서버를 재시작하지 않았습니다.

### Q2: 실시간 보고서에 데이터가 안 보입니다
**A**:
- 브라우저 개발자 도구에서 네트워크 탭 확인
- `google-analytics.com` 요청이 차단되었는지 확인
- 광고 차단 플러그인 비활성화 후 테스트

### Q3: 이벤트는 보이는데 페이지뷰가 안 보입니다
**A**: `trackPageView()` 함수가 호출되는지 콘솔 로그 확인

---

## 10. 체크리스트

설정 완료 체크리스트:
- [ ] Google Analytics 계정 생성
- [ ] 측정 ID (G-XXXXXXXXXX) 복사
- [ ] `.env` 파일에 측정 ID 추가
- [ ] 개발 서버 재시작
- [ ] 콘솔에서 초기화 메시지 확인
- [ ] Google Analytics 실시간 보고서에서 본인 방문 확인
- [ ] 페이지 이동 시 페이지뷰 기록 확인
- [ ] 로그인/로그아웃 이벤트 기록 확인

---

완료되었습니다! 🎉

이제 모든 사용자 행동이 자동으로 Google Analytics에 기록됩니다.
