import { supabase } from './client';

/**
 * Google OAuth 로그인 (팝업 방식)
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
      scopes: 'email profile openid',
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
