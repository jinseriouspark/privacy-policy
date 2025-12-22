# 예약매니아 프로젝트 구조

```
smart_reservation/
├── components/           # React 컴포넌트
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── Dashboard.tsx
│   └── ...
├── lib/                  # 라이브러리 및 유틸리티
│   └── supabase/
│       ├── client.ts     # Supabase 클라이언트
│       ├── auth.ts       # 인증 관련 함수
│       └── database.ts   # DB 쿼리 함수
├── services/             # API 서비스 레이어
│   └── api.ts
├── types/                # TypeScript 타입 정의
│   └── index.ts
├── utils/                # 유틸리티 함수
│   └── auth.ts
├── supabase/             # Supabase 설정
│   └── migrations/       # SQL 마이그레이션
│       └── 001_initial_schema.sql
├── .env                  # 환경 변수 (gitignore)
├── .env.example          # 환경 변수 예시
└── README.md
```

## 환경 변수

- `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
- `VITE_SUPABASE_ANON_KEY`: Public anon key (클라이언트 사용)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (서버 전용, 절대 노출 금지)
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth Client ID
