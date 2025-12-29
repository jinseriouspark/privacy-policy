import { supabase } from './client';

/**
 * Google OAuth 로그인 (팝업 방식)
 */
export async function signInWithGoogle() {
  // Use current origin (supports localhost and production)
  // Redirect back to current path or dashboard
  const currentPath = window.location.pathname;
  const redirectUrl = `${window.location.origin}${currentPath}`;

  console.log('OAuth Redirect URL:', redirectUrl);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
      // Google Calendar API 권한 추가 (캘린더 생성, 이벤트 추가, Meet 링크 생성)
      scopes: 'email profile openid https://www.googleapis.com/auth/calendar',
      skipBrowserRedirect: false
    }
  });

  if (error) throw error;
  return data;
}

/**
 * 로그아웃
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) throw error;

  // 로컬 스토리지 완전히 클리어
  localStorage.clear();
  sessionStorage.clear();
}

/**
 * 현재 사용자 세션 가져오기
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

/**
 * 세션 변경 감지
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Google Calendar 권한 확인
 * @returns true if user has calendar permissions, false otherwise
 */
export async function hasCalendarPermissions() {
  const { data: { session } } = await supabase.auth.getSession();
  return !!(session?.provider_token);
}

/**
 * Google Calendar 권한 재요청 (로그아웃 후 재로그인)
 */
export async function requestCalendarPermissions() {
  // 현재 경로를 저장하여 로그인 후 돌아올 수 있도록 함
  const currentPath = window.location.pathname;
  sessionStorage.setItem('postLoginRedirect', currentPath);

  // 로그아웃 후 재로그인하여 새로운 권한 요청
  await signOut();
  window.location.href = '/login'; // Redirect to login page directly
}
