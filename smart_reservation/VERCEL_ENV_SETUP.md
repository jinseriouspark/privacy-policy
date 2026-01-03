# Vercel 환경변수 설정 가이드

Google OAuth 직접 구현을 완료했습니다. 이제 Vercel에 환경변수를 설정해야 합니다.

## 필수 환경변수

### 1. JWT_SECRET
JWT 토큰 서명에 사용되는 비밀키입니다.

- **값**: `oVZ28aed6kmWYAILtdCZZM2ekvWXVP4GylYvUcHbsO0=`
- **환경**: Production, Preview, Development 모두 체크
- **민감**: Yes (Sensitive 체크)

### 2. GOOGLE_CLIENT_SECRET
Google OAuth Client Secret입니다. Google Cloud Console에서 확인 가능합니다.

- **값**: Google Cloud Console > APIs & Services > Credentials에서 확인
- **환경**: Production, Preview, Development 모두 체크
- **민감**: Yes (Sensitive 체크)

## Vercel 대시보드 설정 방법

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard
   - 프로젝트 선택: `smart_reservation`

2. **Settings → Environment Variables로 이동**

3. **새 환경변수 추가**
   ```
   Name: JWT_SECRET
   Value: oVZ28aed6kmWYAILtdCZZM2ekvWXVP4GylYvUcHbsO0=
   ✅ Production
   ✅ Preview
   ✅ Development
   ✅ Sensitive
   ```

4. **Google Client Secret 추가**
   ```
   Name: GOOGLE_CLIENT_SECRET
   Value: [Google Cloud Console에서 복사]
   ✅ Production
   ✅ Preview
   ✅ Development
   ✅ Sensitive
   ```

## Google Cloud Console - Client Secret 확인

1. https://console.cloud.google.com/apis/credentials 접속
2. OAuth 2.0 Client IDs 섹션에서 현재 Client ID 클릭
3. "Client secret" 값 복사

**현재 Client ID**: `888183052808-gd3ftmi69baff6igje6srtamk340n8hi.apps.googleusercontent.com`

## 배포 후 작업

환경변수를 추가한 후 **반드시 재배포**해야 합니다:

```bash
vercel --prod
```

또는 Vercel 대시보드에서 "Redeploy" 버튼 클릭

## 검증

배포 완료 후 다음을 확인하세요:

1. ✅ 로그인 버튼 클릭 시 Google 로그인 페이지로 리디렉션
2. ✅ Google 로그인 완료 후 `/auth/callback`으로 리디렉션
3. ✅ JWT 토큰 생성 및 localStorage에 저장
4. ✅ 대시보드로 자동 이동
5. ✅ 로그아웃 시 토큰 삭제 및 랜딩 페이지로 이동

## 문제 해결

### JWT_SECRET 오류
- Vercel 함수 로그에서 "JWT_SECRET is not defined" 확인
- 환경변수가 올바르게 설정되었는지 확인
- 재배포 실행

### Google OAuth 오류
- Redirect URI가 올바르게 설정되었는지 확인
- Google Cloud Console > Authorized redirect URIs:
  - `https://your-domain.vercel.app/auth/callback`
  - `http://localhost:5173/auth/callback` (개발용)

## 기존 Supabase Auth 제거

이제 Supabase Auth는 사용하지 않습니다:
- ❌ `lib/supabase/auth.ts` (signInWithGoogle, signOut 등)
- ✅ `lib/google-oauth.ts` (새 OAuth 구현)
- ✅ `lib/jwt.ts` (JWT 토큰 생성/검증)
