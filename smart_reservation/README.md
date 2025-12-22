# 🗓️ Smart Reservation System

Calendly 스타일의 스마트 예약 관리 시스템입니다. 강사와 수강생을 위한 직관적인 1:1 코칭 예약 플랫폼을 제공합니다.

## ✨ 주요 기능

### 👨‍🏫 강사 기능
- **계정 관리**: 강사 전용 프로필 설정 (username, bio)
- **예약 링크 생성**: Calendly 스타일 공유 가능한 예약 링크
- **수강생 관리**: 수강권 조회 및 추가/차감
- **일정 관리**: 근무 시간 설정, 예약 현황 확인
- **자동 알림**: Google Meet 링크 자동 생성 및 이메일 발송

### 👨‍🎓 수강생 기능
- **간편 예약**: 강사별 예약 링크를 통한 원클릭 예약
- **수강권 관리**: 잔여 수강권 실시간 확인
- **예약 내역**: 과거 및 예정된 예약 조회
- **예약 취소**: 1시간 전까지 자유 취소 가능

### 🔐 인증 및 보안
- **Google OAuth 2.0**: 안전한 소셜 로그인
- **계정 타입 구분**: 강사/학생 자동 분류
- **데모 모드**: API 키 없이 빠른 테스트 가능

## 🛠️ 기술 스택

### Frontend
- **React 19** + **TypeScript**
- **Vite** - 초고속 빌드 도구
- **Tailwind CSS** - 유틸리티 퍼스트 스타일링
- **Lucide React** - 아이콘 라이브러리

### Backend
- **Google Apps Script** - 서버리스 백엔드
- **Google Sheets** - 데이터베이스
- **Google Calendar API** - 일정 동기화

## 📦 프로젝트 구조

```
smart_reservation/
├── components/
│   ├── Login.tsx              # 로그인 + 회원가입 통합
│   ├── Signup.tsx             # 회원가입 플로우 (강사/학생 구분)
│   ├── Dashboard.tsx          # 대시보드 (강사/학생 분기)
│   ├── Reservation.tsx        # 예약 시간 선택
│   ├── InstructorProfile.tsx  # 강사 프로필 설정
│   ├── PublicBooking.tsx      # 공개 예약 페이지
│   ├── Layout.tsx             # 레이아웃 래퍼
│   └── ErrorBoundary.tsx      # 에러 핸들링
├── services/
│   └── api.ts                 # API 통신 로직
├── utils/
│   └── auth.ts                # JWT 디코딩
├── types.ts                   # TypeScript 타입 정의
├── constants.ts               # 환경 설정
├── App.tsx                    # 메인 앱
└── Code.gs                    # Google Apps Script 백엔드
```

## 🚀 빠른 시작

### 1. 로컬 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

### 2. 환경 설정

`constants.ts` 파일에서 다음 값을 설정하세요:

```typescript
// Google Apps Script 웹앱 URL
export const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

// Google OAuth Client ID
export const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
```

### 3. 백엔드 설정

1. Google Apps Script 프로젝트 생성
2. `Code.gs` 파일 복사
3. Google Sheets 생성 및 연결
4. 웹 앱으로 배포 (권한: 모든 사용자)
5. 배포 URL을 `constants.ts`에 설정

**자세한 백엔드 설정은 [BACKEND_API_SPEC.md](BACKEND_API_SPEC.md)를 참조하세요.**

## 📝 개발 상태

### ✅ 완료된 기능
- [x] Google OAuth 로그인
- [x] 회원가입 플로우 (강사/학생 구분)
- [x] 강사 프로필 설정
- [x] 예약 링크 생성
- [x] 대시보드 (강사/학생)
- [x] 예약 시스템
- [x] 반응형 UI
- [x] 에러 바운더리
- [x] API 에러 핸들링

### 🚧 진행 중
- [ ] 백엔드 API 통합
- [ ] 이메일 알림 시스템
- [ ] Google Calendar 양방향 동기화

### 📅 예정
- [ ] 다국어 지원 (i18n)
- [ ] 다크 모드
- [ ] 모바일 앱 (React Native)

## 📖 문서

- **[CLAUDE.md](CLAUDE.md)**: 프로젝트 개요 및 개발 원칙
- **[CURRENT_TASK.md](CURRENT_TASK.md)**: 현재 작업 진행 상황
- **[BACKEND_API_SPEC.md](BACKEND_API_SPEC.md)**: 백엔드 API 명세서

## 🤝 기여 방법

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License

## 📧 문의

프로젝트 관련 문의: [이메일 주소]

---

**Made with ❤️ by Smart Coaching Team**
