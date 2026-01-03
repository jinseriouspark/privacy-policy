/**
 * Google OAuth 2.0 직접 구현
 * - OpenID Connect 서버 플로우 완전 준수
 * - State, Nonce 파라미터를 통한 CSRF/Replay 공격 방지
 * - ID 토큰 검증 (iss, aud, exp)
 * - Supabase Auth 의존성 제거
 */

import { generateToken } from './jwt';
import { supabase } from './supabase/client';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const REDIRECT_URI = `${window.location.origin}/auth/callback`;

// OpenID Connect Discovery Document
const DISCOVERY_URL = 'https://accounts.google.com/.well-known/openid-configuration';

// Discovery document cache
let discoveryDoc: any = null;

/**
 * OpenID Connect Discovery Document 가져오기
 */
async function getDiscoveryDocument() {
  if (discoveryDoc) return discoveryDoc;

  const response = await fetch(DISCOVERY_URL);
  discoveryDoc = await response.json();
  return discoveryDoc;
}

/**
 * 1단계: CSRF 방지 State 토큰 생성
 */
function generateStateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 2단계: Replay 방지 Nonce 생성
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Google OAuth 로그인 시작
 */
export async function signInWithGoogle() {
  console.log('[signInWithGoogle] Starting Google OAuth flow');

  const discovery = await getDiscoveryDocument();
  const authorizationEndpoint = discovery.authorization_endpoint;

  // State 토큰 생성 및 세션에 저장
  const state = generateStateToken();
  const nonce = generateNonce();

  sessionStorage.setItem('oauth_state', state);
  sessionStorage.setItem('oauth_nonce', nonce);

  console.log('[signInWithGoogle] Generated state:', state);
  console.log('[signInWithGoogle] Generated nonce:', nonce);

  // Authorization URL 구성
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state: state,
    nonce: nonce,
    access_type: 'offline',
    prompt: 'select_account', // 계정 선택 화면 강제
  });

  const authUrl = `${authorizationEndpoint}?${params.toString()}`;
  console.log('[signInWithGoogle] Redirecting to:', authUrl);

  // Google 로그인 페이지로 리디렉션
  window.location.href = authUrl;
}

/**
 * 3단계: State 토큰 검증
 */
function verifyStateToken(receivedState: string): boolean {
  const savedState = sessionStorage.getItem('oauth_state');

  if (!savedState) {
    console.error('[verifyStateToken] No saved state found');
    return false;
  }

  if (savedState !== receivedState) {
    console.error('[verifyStateToken] State mismatch');
    return false;
  }

  console.log('[verifyStateToken] State verified successfully');
  return true;
}

/**
 * 4단계: Authorization Code를 Access Token으로 교환
 */
async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn: number;
}> {
  console.log('[exchangeCodeForTokens] Exchanging code for tokens');

  // 서버에서 토큰 교환 (Client Secret 보호)
  const response = await fetch('/api/google-oauth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      redirectUri: REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('[exchangeCodeForTokens] Token exchange failed:', error);
    throw new Error(error.error || 'Token exchange failed');
  }

  const data = await response.json();

  console.log('[exchangeCodeForTokens] Tokens received');
  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * 5단계: ID 토큰 검증 및 사용자 정보 추출
 */
async function verifyIdToken(idToken: string): Promise<{
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}> {
  console.log('[verifyIdToken] Verifying ID token');

  // ID 토큰은 JWT 형식: header.payload.signature
  const [headerB64, payloadB64, signatureB64] = idToken.split('.');

  if (!headerB64 || !payloadB64 || !signatureB64) {
    throw new Error('Invalid ID token format');
  }

  // Payload 디코딩
  const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));

  console.log('[verifyIdToken] ID token payload:', payload);

  // 1. Issuer 검증
  if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
    throw new Error('Invalid issuer: ' + payload.iss);
  }

  // 2. Audience 검증 (클라이언트 ID와 일치해야 함)
  if (payload.aud !== GOOGLE_CLIENT_ID) {
    throw new Error('Invalid audience: ' + payload.aud);
  }

  // 3. Expiry 검증
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    throw new Error('ID token expired');
  }

  // 4. Nonce 검증 (Replay 공격 방지)
  const savedNonce = sessionStorage.getItem('oauth_nonce');
  if (savedNonce && payload.nonce !== savedNonce) {
    throw new Error('Invalid nonce');
  }

  console.log('[verifyIdToken] ID token verified successfully');

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    email_verified: payload.email_verified,
  };
}

/**
 * 6단계: OAuth Callback 처리
 */
export async function handleOAuthCallback(): Promise<{
  user: any;
  token: string;
}> {
  console.log('[handleOAuthCallback] Processing OAuth callback');

  // URL에서 code와 state 추출
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');

  if (error) {
    throw new Error(`OAuth error: ${error}`);
  }

  if (!code || !state) {
    throw new Error('Missing code or state parameter');
  }

  // State 검증
  if (!verifyStateToken(state)) {
    throw new Error('State verification failed - possible CSRF attack');
  }

  // Code를 토큰으로 교환
  const tokens = await exchangeCodeForTokens(code);

  // ID 토큰 검증 및 사용자 정보 추출
  const userInfo = await verifyIdToken(tokens.idToken);

  // 사용자 DB에 저장 (or 업데이트)
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      googleId: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create user session');
  }

  const { user, token, supabaseSession } = await response.json();

  // 세션 정리
  sessionStorage.removeItem('oauth_state');
  sessionStorage.removeItem('oauth_nonce');

  console.log('[handleOAuthCallback] Login successful:', user);

  // 1. 커스텀 JWT 토큰 저장
  localStorage.setItem('auth_token', token);

  // 2. Supabase Auth 세션 생성 (RLS용)
  if (supabaseSession?.email && supabaseSession?.password) {
    console.log('[handleOAuthCallback] Creating Supabase Auth session...');

    // 비밀번호로 로그인하여 실제 세션 생성
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: supabaseSession.email,
      password: supabaseSession.password,
    });

    if (authError) {
      console.error('[handleOAuthCallback] Supabase Auth login error:', authError);
    } else {
      console.log('[handleOAuthCallback] Supabase Auth session created successfully');
    }
  }

  return { user, token };
}

/**
 * 로그아웃
 */
export async function signOut() {
  localStorage.removeItem('auth_token');
  sessionStorage.clear();

  // 서버 세션 무효화
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    },
  });

  window.location.href = '/';
}

/**
 * 현재 사용자 세션 가져오기
 */
export async function getCurrentUser(): Promise<any | null> {
  const token = localStorage.getItem('auth_token');

  if (!token) {
    return null;
  }

  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // 토큰이 만료되었거나 유효하지 않음
      localStorage.removeItem('auth_token');
      return null;
    }

    const user = await response.json();
    return user;
  } catch (error) {
    console.error('[getCurrentUser] Error:', error);
    localStorage.removeItem('auth_token');
    return null;
  }
}

/**
 * Calendar 권한 추가 요청 (Incremental Authorization)
 */
export async function requestCalendarPermissions() {
  console.log('[requestCalendarPermissions] Requesting calendar scopes');

  const discovery = await getDiscoveryDocument();
  const authorizationEndpoint = discovery.authorization_endpoint;

  const state = generateStateToken();
  sessionStorage.setItem('oauth_state', state);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
    state: state,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true', // Incremental Authorization
  });

  window.location.href = `${authorizationEndpoint}?${params.toString()}`;
}
