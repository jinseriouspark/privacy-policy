# 백엔드 API 명세서

## 개요
프론트엔드에서 필요한 Google Apps Script (Code.gs) API 엔드포인트 명세입니다.

---

## 🔐 인증 관련 API

### 1. 로그인 / 자동 회원가입
**기존 API 수정 필요**

```javascript
// Request
{
  action: 'login',
  email: string,
  name: string,
  picture?: string
}

// Response (기존 사용자)
{
  status: 'success',
  data: {
    email: string,
    name: string,
    remaining: number,
    total?: number,
    picture?: string,
    userType: 'student' | 'instructor',  // [NEW]
    username?: string,                   // [NEW] 강사 전용
    bio?: string,                        // [NEW] 강사 전용
    isProfileComplete: boolean,          // [NEW]
    isNewUser: false                     // [NEW]
  }
}

// Response (신규 사용자)
{
  status: 'success',
  data: {
    email: string,
    name: string,
    picture?: string,
    isNewUser: true,                     // [NEW] 프론트엔드가 회원가입 플로우로 이동
    remaining: 0,
    userType: null                       // [NEW] 아직 설정 안됨
  }
}
```

**구현 로직:**
1. 이메일로 기존 사용자 조회
2. 없으면 `isNewUser: true` 반환 (임시 레코드 생성 안함)
3. 있으면 전체 사용자 정보 반환

---

### 2. 회원가입 완료
**신규 API 추가 필요**

```javascript
// Request
{
  action: 'completeSignup',
  email: string,
  name: string,
  picture?: string,
  userType: 'student' | 'instructor',
  username?: string,  // 강사만 필수
  bio?: string        // 선택
}

// Response
{
  status: 'success',
  data: {
    email: string,
    name: string,
    remaining: number,  // 학생: 0, 강사: 999
    total?: number,     // 강사만
    picture?: string,
    userType: 'student' | 'instructor',
    username?: string,
    bio?: string,
    isProfileComplete: true
  }
}
```

**구현 로직:**
1. 사용자 타입에 따라 초기 데이터 다르게 설정
   - 학생: remaining=0, total=0
   - 강사: remaining=999, total=0 (무제한)
2. username 중복 체크 (강사인 경우)
3. 스프레드시트에 새 행 추가
4. 전체 사용자 정보 반환

**스프레드시트 스키마 업데이트:**
기존 시트에 컬럼 추가:
- `userType` (string): 'student' | 'instructor'
- `username` (string): 강사 전용, 공개 URL에 사용
- `bio` (string): 강사 소개

---

## 👤 프로필 관리 API

### 3. 강사 프로필 업데이트
**신규 API 추가 필요**

```javascript
// Request
{
  action: 'updateInstructorProfile',
  email: string,        // 현재 로그인한 강사 이메일
  name: string,
  username: string,
  bio?: string
}

// Response
{
  status: 'success',
  data: {
    email: string,
    name: string,
    username: string,
    bio?: string,
    // ... 기타 사용자 정보
  }
}

// Error Response (username 중복 시)
{
  status: 'error',
  message: '이미 사용 중인 사용자 이름입니다.'
}
```

**구현 로직:**
1. 이메일로 사용자 조회
2. userType이 'instructor'인지 확인
3. username 중복 체크 (본인 제외)
4. 해당 행 업데이트
5. 업데이트된 정보 반환

---

## 📅 공개 예약 페이지 API

### 4. 강사 공개 정보 조회
**신규 API 추가 필요**

```javascript
// Request
{
  action: 'getInstructorPublicInfo',
  instructorEmail: string
}

// Response
{
  status: 'success',
  data: {
    id: string,           // 이메일 또는 username
    name: string,
    bio: string,
    avatarUrl: string     // picture URL
  }
}

// Error Response (강사 없음)
{
  status: 'error',
  message: '강사를 찾을 수 없습니다.'
}
```

**구현 로직:**
1. instructorEmail로 사용자 조회
2. userType이 'instructor'인지 확인
3. 공개 가능한 정보만 반환 (이메일, 전화번호 등 제외)

---

## 🔧 기존 API 수정 사항

### 5. getCoachDashboard
**수정 필요**

userType 필드 추가:
```javascript
// Response에 추가
{
  ...existing fields,
  isCoach: true,
  userType: 'instructor'  // [NEW]
}
```

### 6. getRemainingSessions
**수정 필요**

userType 필드 추가:
```javascript
// Response에 추가
{
  ...existing fields,
  userType: 'student'  // [NEW]
}
```

---

## 📊 스프레드시트 스키마

### Users 시트 컬럼 구조 (업데이트)

| 컬럼명 | 타입 | 설명 | 비고 |
|--------|------|------|------|
| email | string | 사용자 이메일 | Primary Key |
| name | string | 이름 | |
| picture | string | 프로필 이미지 URL | Google OAuth |
| remaining | number | 잔여 수강권 | |
| total | number | 전체 수강권 | |
| **userType** | string | 사용자 타입 | **[NEW]** 'student' or 'instructor' |
| **username** | string | 사용자명 (URL용) | **[NEW]** 강사 전용, 유니크 |
| **bio** | string | 소개 | **[NEW]** 강사 전용 |
| createdAt | timestamp | 생성일시 | |
| updatedAt | timestamp | 수정일시 | |

---

## 🚀 구현 우선순위

### 1단계 (필수)
- [ ] `login` API 수정 (isNewUser 플래그)
- [ ] `completeSignup` API 신규 구현
- [ ] 스프레드시트 컬럼 추가

### 2단계 (중요)
- [ ] `updateInstructorProfile` API 신규 구현
- [ ] `getInstructorPublicInfo` API 신규 구현
- [ ] 기존 Dashboard API에 userType 추가

### 3단계 (향후)
- [ ] username 기반 조회 API
- [ ] 이메일 알림 시스템
- [ ] Google Calendar 동기화

---

## 🧪 테스트 시나리오

### 신규 사용자 가입 플로우
1. Google 로그인 → `login` API 호출 → `isNewUser: true` 반환
2. 프론트엔드: 회원가입 페이지 표시
3. 사용자: 계정 유형 선택 (강사/학생)
4. 강사 선택 시: username, bio 입력
5. `completeSignup` API 호출
6. 프로필 완성 → 대시보드 이동

### 강사 프로필 수정 플로우
1. 대시보드 → 설정 아이콘 클릭
2. 프로필 페이지 표시
3. 정보 수정 후 저장
4. `updateInstructorProfile` API 호출
5. 성공 → 대시보드로 복귀

### 공개 예약 페이지 접속
1. 예약 링크 클릭: `?coach=instructor@email.com`
2. `getInstructorPublicInfo` API 호출
3. 강사 정보 표시
4. 예약하기 버튼 클릭 → 로그인 요구

---

## ⚠️ 주의사항

1. **Username 유니크 제약**
   - completeSignup, updateInstructorProfile에서 중복 검증 필수
   - 대소문자 구분 없이 비교 (소문자로 저장)

2. **데이터 마이그레이션**
   - 기존 사용자는 모두 userType='student'로 기본 설정
   - 관리자가 수동으로 강사 계정 전환 필요

3. **보안**
   - 공개 API는 민감한 정보 노출 금지
   - instructorId 검증 강화

4. **성능**
   - username 조회 시 인덱싱 고려
   - 캐싱 전략 필요 (특히 공개 페이지)

---

## 📞 문의
프론트엔드 구현 완료. 백엔드 API 구현 후 통합 테스트 진행 예정.
